export function Terms() {
  return (
    <section id="terms" className="py-20 bg-gradient-to-br from-background/90 via-background to-background/95">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Terms and Conditions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto prose prose-lg prose-slate">
          <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using aiborg's platform and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">2. Service Description</h3>
              <p className="text-muted-foreground">
                aiborg provides AI-powered educational content and courses through our SaaS platform. We offer personalized learning experiences for various age groups and professional levels, including interactive content, assessments, and certification programs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h3>
              <p className="text-muted-foreground">
                Users must create an account to access our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">4. Payment and Subscriptions</h3>
              <p className="text-muted-foreground">
                Course fees are clearly displayed before purchase. Payments are processed securely through our payment partners. We offer a 30-day money-back guarantee for all courses. Refunds will be processed to the original payment method within 5-10 business days.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">5. Intellectual Property</h3>
              <p className="text-muted-foreground">
                All content, materials, and intellectual property on our platform are owned by aiborg or our licensors. Users may access and use the content for personal educational purposes only. Redistribution, copying, or commercial use of our content is strictly prohibited.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">6. User Conduct</h3>
              <p className="text-muted-foreground">
                Users must not use our platform for any unlawful purpose or in any way that could damage, disable, or impair our services. This includes, but is not limited to, sharing account credentials, attempting to access unauthorized areas, or interfering with other users' experiences.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">7. Privacy and Data Protection</h3>
              <p className="text-muted-foreground">
                We are committed to protecting your privacy and personal data in accordance with GDPR and other applicable privacy laws. Please refer to our Privacy Policy for detailed information about how we collect, use, and protect your data.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">8. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                aiborg shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our platform. Our total liability shall not exceed the amount paid by you for the specific service in question.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">9. Service Availability</h3>
              <p className="text-muted-foreground">
                While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to our platform. We may perform maintenance, updates, or experience technical issues that could temporarily affect service availability.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">10. Termination</h3>
              <p className="text-muted-foreground">
                Either party may terminate the service agreement at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, you will lose access to the platform and any associated benefits.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">11. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications. Continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">12. Contact Information</h3>
              <p className="text-muted-foreground">
                For questions about these terms or our services, please contact us through our support channels. We are committed to resolving any issues promptly and fairly.
              </p>
            </div>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}<br />
                These terms are governed by the laws of the United Kingdom. Any disputes will be resolved through the courts of England and Wales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}