import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('VITE_APP_URL') || 'https://aiborg-ai-web.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FamilyMember {
  name: string;
  email: string;
  relationship: string;
}

interface VaultClaimRequest {
  userName: string;
  userEmail: string;
  vaultEmail: string;
  vaultSubscriptionEndDate: string;
  familyMembers: FamilyMember[];
  metadata?: Record<string, any>;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const claimData: VaultClaimRequest = await req.json();

    // Validate required fields
    if (!claimData.userName || !claimData.userEmail || !claimData.vaultEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userName, userEmail, and vaultEmail are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(claimData.userEmail) || !emailRegex.test(claimData.vaultEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate family members count (max 6)
    if (claimData.familyMembers && claimData.familyMembers.length > 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Maximum 6 family members allowed',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate family member emails
    if (claimData.familyMembers) {
      for (const member of claimData.familyMembers) {
        if (!member.name || !member.email || !member.relationship) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Each family member must have name, email, and relationship',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        if (!emailRegex.test(member.email)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Invalid email format for family member: ${member.name}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Check for existing pending or approved claim
    const { data: existingClaim, error: checkError } = await supabase
      .from('vault_subscription_claims')
      .select('id, status')
      .eq('user_email', claimData.userEmail)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing claim:', checkError);
    }

    if (existingClaim) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `You already have a ${existingClaim.status} claim request. Please wait for admin review or contact support.`,
          claimId: existingClaim.id,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user_id if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Create the claim using the database function
    const { data: claimId, error: submitError } = await supabase.rpc('submit_vault_claim', {
      p_user_id: userId,
      p_user_email: claimData.userEmail,
      p_user_name: claimData.userName,
      p_vault_email: claimData.vaultEmail,
      p_vault_subscription_end_date: claimData.vaultSubscriptionEndDate,
      p_family_members: JSON.stringify(claimData.familyMembers || []),
      p_metadata: JSON.stringify(claimData.metadata || {}),
    });

    if (submitError) {
      console.error('Error submitting claim:', submitError);
      return new Response(
        JSON.stringify({
          success: false,
          error: submitError.message || 'Failed to submit claim',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Format dates for email
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return dateString;
      }
    };

    const now = new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send confirmation email to user
    try {
      await supabase.functions.invoke('send-email-notification', {
        body: {
          to: claimData.userEmail,
          type: 'vault_claim_submitted',
          data: {
            userName: claimData.userName,
            userEmail: claimData.userEmail,
            vaultEmail: claimData.vaultEmail,
            subscriptionEndDate: formatDate(claimData.vaultSubscriptionEndDate),
            familyMembersCount: claimData.familyMembers?.length || 0,
            claimId: claimId,
          },
        },
      });
    } catch (emailError) {
      console.error('Error sending user confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Get admin emails
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'super_admin'])
      .not('email', 'is', null);

    // Send notification to all admins
    if (admins && admins.length > 0) {
      const adminDashboardUrl = `${APP_URL}/admin?tab=vault-claims`;
      const approveUrl = `${SUPABASE_URL}/functions/v1/process-vault-claim?claimId=${claimId}&action=approve`;
      const rejectUrl = `${SUPABASE_URL}/functions/v1/process-vault-claim?claimId=${claimId}&action=reject`;

      for (const admin of admins) {
        if (admin.email) {
          try {
            await supabase.functions.invoke('send-email-notification', {
              body: {
                to: admin.email,
                type: 'vault_claim_admin_notification',
                data: {
                  userName: claimData.userName,
                  userEmail: claimData.userEmail,
                  vaultEmail: claimData.vaultEmail,
                  subscriptionEndDate: formatDate(claimData.vaultSubscriptionEndDate),
                  familyMembersCount: claimData.familyMembers?.length || 0,
                  familyMembers: claimData.familyMembers || [],
                  claimId: claimId,
                  submittedAt: now,
                  adminDashboardUrl,
                  approveUrl,
                  rejectUrl,
                },
              },
            });
          } catch (emailError) {
            console.error(`Error sending admin notification to ${admin.email}:`, emailError);
            // Continue sending to other admins
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        claimId: claimId,
        message:
          'Your claim has been submitted successfully. You will receive an email confirmation shortly.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
