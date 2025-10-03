import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log("Webhook event type:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Payment successful for session:", session.id);
      console.log("Customer email:", session.customer_email);
      console.log("Metadata:", session.metadata);

      // Get course information from metadata
      const courseName = session.metadata?.courseName;
      const courseId = session.metadata?.courseId ? parseInt(session.metadata.courseId) : null;
      const studentName = session.metadata?.studentName;
      const email = session.metadata?.email || session.customer_email;

      if (!email) {
        console.error("Missing email information");
        return new Response(
          JSON.stringify({ error: "Missing required metadata" }),
          { status: 400 }
        );
      }

      // Initialize Supabase client with service role key
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find the user by email
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (userError) {
        console.error("Error finding user:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to find user" }),
          { status: 500 }
        );
      }

      if (!users || users.length === 0) {
        console.error("User not found with email:", email);
        // Try to find user in auth.users table
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
          console.error("Error listing auth users:", authError);
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404 }
          );
        }

        const authUser = authData.users.find(u => u.email === email);
        if (!authUser) {
          console.error("User not found in auth.users with email:", email);
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404 }
          );
        }

        // Use auth user id
        const userId = authUser.id;

        // Find course - use courseId if available, otherwise find by name
        let finalCourseId = courseId;
        if (!finalCourseId && courseName) {
          const { data: courses, error: courseError } = await supabase
            .from("courses")
            .select("id")
            .eq("title", courseName)
            .limit(1);

          if (courseError || !courses || courses.length === 0) {
            console.error("Course not found:", courseName, courseError);
            return new Response(
              JSON.stringify({ error: "Course not found" }),
              { status: 404 }
            );
          }

          finalCourseId = courses[0].id;
        }

        if (!finalCourseId) {
          console.error("No course ID available");
          return new Response(
            JSON.stringify({ error: "Course not found" }),
            { status: 404 }
          );
        }

        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", finalCourseId)
          .single();

        if (existingEnrollment) {
          console.log("Enrollment already exists, skipping creation");
          return new Response(
            JSON.stringify({ success: true, message: "Already enrolled" }),
            { status: 200 }
          );
        }

        // Create enrollment
        const { data: enrollment, error: enrollError } = await supabase
          .from("enrollments")
          .insert({
            user_id: userId,
            course_id: finalCourseId,
            payment_status: "completed",
            payment_amount: session.amount_total ? session.amount_total / 100 : null,
            payment_session_id: session.id,
          })
          .select()
          .single();

        if (enrollError) {
          console.error("Error creating enrollment:", enrollError);
          return new Response(
            JSON.stringify({ error: "Failed to create enrollment" }),
            { status: 500 }
          );
        }

        console.log("Enrollment created successfully:", enrollment);

        // Generate invoice
        try {
          await supabase.functions.invoke("generate-invoice", {
            body: {
              enrollmentId: enrollment.id,
              userId: userId,
              itemType: "course",
            },
          });
          console.log("Invoice generation triggered");
        } catch (invoiceError) {
          console.error("Invoice generation failed:", invoiceError);
          // Don't fail the webhook if invoice generation fails
        }

        return new Response(
          JSON.stringify({
            success: true,
            enrollmentId: enrollment.id,
            message: "Enrollment created successfully"
          }),
          { status: 200 }
        );
      }

      const userId = users[0].id;

      // Find course - use courseId if available, otherwise find by name
      let finalCourseId = courseId;
      if (!finalCourseId && courseName) {
        const { data: courses, error: courseError } = await supabase
          .from("courses")
          .select("id")
          .eq("title", courseName)
          .limit(1);

        if (courseError || !courses || courses.length === 0) {
          console.error("Course not found:", courseName, courseError);
          return new Response(
            JSON.stringify({ error: "Course not found" }),
            { status: 404 }
          );
        }

        finalCourseId = courses[0].id;
      }

      if (!finalCourseId) {
        console.error("No course ID available");
        return new Response(
          JSON.stringify({ error: "Course not found" }),
          { status: 404 }
        );
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", finalCourseId)
        .single();

      if (existingEnrollment) {
        console.log("Enrollment already exists, skipping creation");
        return new Response(
          JSON.stringify({ success: true, message: "Already enrolled" }),
          { status: 200 }
        );
      }

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          user_id: userId,
          course_id: finalCourseId,
          payment_status: "completed",
          payment_amount: session.amount_total ? session.amount_total / 100 : null,
          payment_session_id: session.id,
        })
        .select()
        .single();

      if (enrollError) {
        console.error("Error creating enrollment:", enrollError);
        return new Response(
          JSON.stringify({ error: "Failed to create enrollment" }),
          { status: 500 }
        );
      }

      console.log("Enrollment created successfully:", enrollment);

      // Generate invoice
      try {
        await supabase.functions.invoke("generate-invoice", {
          body: {
            enrollmentId: enrollment.id,
            userId: userId,
            itemType: "course",
          },
        });
        console.log("Invoice generation triggered");
      } catch (invoiceError) {
        console.error("Invoice generation failed:", invoiceError);
        // Don't fail the webhook if invoice generation fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          enrollmentId: enrollment.id,
          message: "Enrollment created successfully"
        }),
        { status: 200 }
      );
    }

    // For other event types, just acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
