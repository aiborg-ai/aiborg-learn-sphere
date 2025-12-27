import { Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { ArrowLeft } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="py-20 bg-gradient-to-br from-background/90 via-background to-background/95">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <div className="mb-8">
              <Button variant="ghost" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Terms and Conditions
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Please read these terms carefully before using our platform
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last Updated:{' '}
                {new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto prose prose-lg prose-slate">
              <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg p-8 space-y-8">
                {/* Acceptance of Terms */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-muted-foreground">
                    By accessing and using Aiborg's platform and services, you accept and agree to
                    be bound by the terms and provision of this agreement. If you do not agree to
                    abide by these terms, please do not use this service.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    These terms apply to all visitors, users, and others who access or use our
                    platform, including but not limited to students, instructors, and
                    administrators.
                  </p>
                </div>

                {/* Service Description */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    2. Service Description
                  </h2>
                  <p className="text-muted-foreground">
                    Aiborg provides AI-powered educational content and courses through our SaaS
                    platform. We offer personalized learning experiences for various age groups and
                    professional levels, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Interactive AI and technology courses</li>
                    <li>Assessment tools (AI Readiness, AI Awareness, AI Fluency)</li>
                    <li>Certification programs</li>
                    <li>Workshops and live sessions</li>
                    <li>Community forums and discussion boards</li>
                    <li>Personalized learning paths</li>
                    <li>Gamification and achievement systems</li>
                  </ul>
                </div>

                {/* User Accounts */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                  <p className="text-muted-foreground">
                    Users must create an account to access our services. You are responsible for
                    maintaining the confidentiality of your account credentials and for all
                    activities that occur under your account. You must notify us immediately of any
                    unauthorized use of your account.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    When creating an account, you agree to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                    <li>Provide accurate and complete information</li>
                    <li>Keep your account information up to date</li>
                    <li>Not share your account credentials with others</li>
                    <li>Notify us immediately of any security breach</li>
                    <li>Be responsible for all activity under your account</li>
                  </ul>
                </div>

                {/* Payment and Subscriptions */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    4. Payment and Subscriptions
                  </h2>
                  <p className="text-muted-foreground">
                    Course fees are clearly displayed before purchase. Payments are processed
                    securely through our payment partners (Stripe).
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 Pricing</h3>
                  <p className="text-muted-foreground">
                    All prices are displayed in the applicable currency and include applicable taxes
                    unless otherwise stated. We reserve the right to modify pricing at any time.
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                    4.2 Refund Policy
                  </h3>
                  <p className="text-muted-foreground">
                    We offer a 30-day money-back guarantee for all courses. Refunds will be
                    processed to the original payment method within 5-10 business days. Refund
                    requests must be submitted through our support channels.
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                    4.3 Subscriptions
                  </h3>
                  <p className="text-muted-foreground">
                    Family memberships and other subscription plans automatically renew unless
                    cancelled before the renewal date. You can manage your subscription through your
                    account settings.
                  </p>
                </div>

                {/* Intellectual Property */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    5. Intellectual Property
                  </h2>
                  <p className="text-muted-foreground">
                    All content, materials, and intellectual property on our platform are owned by
                    Aiborg or our licensors. This includes but is not limited to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Course content, videos, and materials</li>
                    <li>Assessment questions and methodologies</li>
                    <li>Platform software and design</li>
                    <li>Logos, trademarks, and branding</li>
                    <li>AI-generated content and recommendations</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Users may access and use the content for personal educational purposes only.
                    Redistribution, copying, or commercial use of our content is strictly prohibited
                    without prior written consent.
                  </p>
                </div>

                {/* User Conduct */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">6. User Conduct</h2>
                  <p className="text-muted-foreground">
                    Users must not use our platform for any unlawful purpose or in any way that
                    could damage, disable, or impair our services. Prohibited activities include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Sharing account credentials with others</li>
                    <li>Attempting to access unauthorized areas of the platform</li>
                    <li>Interfering with other users' experiences</li>
                    <li>Uploading malicious content or code</li>
                    <li>Harassing, threatening, or abusing other users</li>
                    <li>Cheating on assessments or submitting false information</li>
                    <li>Using automated tools to access the platform</li>
                    <li>Copying or redistributing course materials</li>
                  </ul>
                </div>

                {/* User-Generated Content */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    7. User-Generated Content
                  </h2>
                  <p className="text-muted-foreground">
                    Our platform allows users to submit content such as forum posts, reviews, and
                    discussion comments. By submitting content, you:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>
                      Grant us a non-exclusive license to use, display, and distribute your content
                    </li>
                    <li>Warrant that you own or have rights to the content</li>
                    <li>Agree that we may moderate or remove content at our discretion</li>
                    <li>Remain responsible for the accuracy and legality of your content</li>
                  </ul>
                </div>

                {/* Privacy and Data Protection */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    8. Privacy and Data Protection
                  </h2>
                  <p className="text-muted-foreground">
                    We are committed to protecting your privacy and personal data in accordance with
                    GDPR and other applicable privacy laws. Please refer to our{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    for detailed information about how we collect, use, and protect your data.
                  </p>
                </div>

                {/* Limitation of Liability */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    9. Limitation of Liability
                  </h2>
                  <p className="text-muted-foreground">
                    Aiborg shall not be liable for any indirect, incidental, special, consequential,
                    or punitive damages resulting from your use of our platform. This includes but
                    is not limited to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Loss of profits or revenue</li>
                    <li>Loss of data or content</li>
                    <li>Business interruption</li>
                    <li>Loss of anticipated savings</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Our total liability shall not exceed the amount paid by you for the specific
                    service in question during the twelve (12) months preceding the claim.
                  </p>
                </div>

                {/* Disclaimer of Warranties */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    10. Disclaimer of Warranties
                  </h2>
                  <p className="text-muted-foreground">
                    Our platform and services are provided "as is" and "as available" without
                    warranties of any kind, either express or implied. We do not warrant that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>The platform will be uninterrupted or error-free</li>
                    <li>Defects will be corrected</li>
                    <li>The platform is free of viruses or harmful components</li>
                    <li>The results from using the platform will meet your expectations</li>
                  </ul>
                </div>

                {/* Service Availability */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    11. Service Availability
                  </h2>
                  <p className="text-muted-foreground">
                    While we strive to maintain continuous service availability, we do not guarantee
                    uninterrupted access to our platform. We may perform maintenance, updates, or
                    experience technical issues that could temporarily affect service availability.
                    We will endeavor to provide notice of planned maintenance where possible.
                  </p>
                </div>

                {/* Termination */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">12. Termination</h2>
                  <p className="text-muted-foreground">
                    Either party may terminate the service agreement at any time. We reserve the
                    right to suspend or terminate accounts that violate these terms without prior
                    notice. Upon termination:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>You will lose access to the platform and any associated benefits</li>
                    <li>Your data will be handled according to our Privacy Policy</li>
                    <li>Any outstanding payments remain due</li>
                    <li>Provisions that should survive termination will remain in effect</li>
                  </ul>
                </div>

                {/* Indemnification */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    13. Indemnification
                  </h2>
                  <p className="text-muted-foreground">
                    You agree to indemnify and hold harmless Aiborg, its officers, directors,
                    employees, and agents from any claims, damages, losses, or expenses arising
                    from:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Your violation of these terms</li>
                    <li>Your use of the platform</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Any content you submit to the platform</li>
                  </ul>
                </div>

                {/* Changes to Terms */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    14. Changes to Terms
                  </h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. Users will be notified
                    of significant changes via email or platform notifications. Continued use of our
                    services after changes constitutes acceptance of the new terms.
                  </p>
                </div>

                {/* Governing Law */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">15. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These terms are governed by the laws of the United Kingdom. Any disputes will be
                    resolved through the courts of England and Wales. For EU residents, this does
                    not affect your rights under mandatory consumer protection laws in your country.
                  </p>
                </div>

                {/* Severability */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">16. Severability</h2>
                  <p className="text-muted-foreground">
                    If any provision of these terms is found to be unenforceable, the remaining
                    provisions will continue in full force and effect. The unenforceable provision
                    will be modified to the minimum extent necessary to make it enforceable.
                  </p>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    17. Contact Information
                  </h2>
                  <p className="text-muted-foreground">
                    For questions about these terms or our services, please contact us:
                  </p>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-muted-foreground">
                      <strong>Aiborg</strong>
                      <br />
                      Email:{' '}
                      <a href="mailto:legal@aiborg.ai" className="text-primary hover:underline">
                        legal@aiborg.ai
                      </a>
                      <br />
                      General Inquiries:{' '}
                      <a href="mailto:info@aiborg.ai" className="text-primary hover:underline">
                        info@aiborg.ai
                      </a>
                      <br />
                      Support:{' '}
                      <a href="mailto:support@aiborg.ai" className="text-primary hover:underline">
                        support@aiborg.ai
                      </a>
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    By using our platform, you acknowledge that you have read, understood, and agree
                    to be bound by these Terms and Conditions. If you have any questions, please
                    contact us before using our services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
