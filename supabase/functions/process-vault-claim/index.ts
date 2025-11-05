import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('VITE_APP_URL') || 'https://aiborg-ai-web.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessClaimRequest {
  claimId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
  grantEndDate?: string; // Optional: admin can override the auto-sync date
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Missing authorization header',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid token',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden: Admin access required',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request - support both JSON body and URL params (for email links)
    let requestData: ProcessClaimRequest;

    if (req.method === 'GET') {
      // For email link clicks (approve/reject buttons in admin email)
      const url = new URL(req.url);
      const claimId = url.searchParams.get('claimId');
      const action = url.searchParams.get('action') as 'approve' | 'reject';

      if (!claimId || !action) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required parameters: claimId and action',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      requestData = { claimId, action };
    } else {
      // For POST requests from admin dashboard
      requestData = await req.json();
    }

    const { claimId, action, rejectionReason, adminNotes, grantEndDate } = requestData;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch the claim details
    const { data: claim, error: fetchError } = await supabase
      .from('vault_subscription_claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (fetchError || !claim) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Claim not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if claim is pending
    if (claim.status !== 'pending') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Claim has already been ${claim.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process based on action
    if (action === 'approve') {
      // Determine grant end date (use admin override or vault subscription end date)
      const endDate = grantEndDate || claim.vault_subscription_end_date;

      // Approve the claim using database function
      const { data: grantId, error: approveError } = await supabase.rpc('approve_vault_claim', {
        p_claim_id: claimId,
        p_admin_user_id: user.id,
        p_grant_end_date: endDate,
        p_admin_notes: adminNotes || null,
      });

      if (approveError) {
        console.error('Error approving claim:', approveError);
        return new Response(
          JSON.stringify({
            success: false,
            error: approveError.message || 'Failed to approve claim',
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

      // Send approval email to user
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            to: claim.user_email,
            type: 'vault_claim_approved',
            data: {
              userName: claim.user_name,
              accessEndDate: formatDate(endDate),
              familyMembersAdded: claim.family_members?.length || 0,
              adminNotes: adminNotes,
              dashboardUrl: `${APP_URL}/dashboard`,
              coursesUrl: `${APP_URL}/courses`,
              vaultUrl: `${APP_URL}/vault`,
              supportUrl: `${APP_URL}/support`,
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the request if email fails
      }

      // Send family invitations if family members were added
      if (
        claim.family_members &&
        Array.isArray(claim.family_members) &&
        claim.family_members.length > 0
      ) {
        for (const member of claim.family_members) {
          try {
            await supabase.functions.invoke('send-email-notification', {
              body: {
                to: member.email,
                type: 'family_invitation',
                data: {
                  inviterName: claim.user_name,
                  memberName: member.name,
                  relationship: member.relationship,
                  inviteUrl: `${APP_URL}/auth?email=${encodeURIComponent(member.email)}`,
                },
              },
            });
          } catch (inviteError) {
            console.error(`Error sending invitation to ${member.email}:`, inviteError);
            // Continue sending other invitations
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Claim approved successfully',
          grantId: grantId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Reject action
      if (!rejectionReason) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rejection reason is required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Reject the claim using database function
      const { error: rejectError } = await supabase.rpc('reject_vault_claim', {
        p_claim_id: claimId,
        p_admin_user_id: user.id,
        p_rejection_reason: rejectionReason,
        p_admin_notes: adminNotes || null,
      });

      if (rejectError) {
        console.error('Error rejecting claim:', rejectError);
        return new Response(
          JSON.stringify({
            success: false,
            error: rejectError.message || 'Failed to reject claim',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Send rejection email to user
      try {
        await supabase.functions.invoke('send-email-notification', {
          body: {
            to: claim.user_email,
            type: 'vault_claim_rejected',
            data: {
              userName: claim.user_name,
              claimId: claimId,
              rejectionReason: rejectionReason,
              adminNotes: adminNotes,
              resubmitUrl: `${APP_URL}/claim-free-pass`,
              enrollUrl: `${APP_URL}/family-membership`,
              supportUrl: `${APP_URL}/support`,
              faqUrl: `${APP_URL}/faq`,
              dashboardUrl: `${APP_URL}/dashboard`,
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the request if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Claim rejected successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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
