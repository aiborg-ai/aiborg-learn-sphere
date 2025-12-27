import { Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { ArrowLeft } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your privacy is important to us. This policy explains how we collect, use, and
                protect your data.
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
                {/* Introduction */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    Welcome to Aiborg ("we," "our," or "us"). We are committed to protecting your
                    personal information and your right to privacy. This Privacy Policy explains how
                    we collect, use, disclose, and safeguard your information when you visit our
                    website and use our AI-powered learning platform.
                  </p>
                  <p className="text-muted-foreground mt-4">
                    Please read this privacy policy carefully. If you do not agree with the terms of
                    this privacy policy, please do not access the site or use our services.
                  </p>
                </div>

                {/* Information We Collect */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    2. Information We Collect
                  </h2>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    2.1 Personal Information
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    We collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Register for an account</li>
                    <li>Enroll in courses or programs</li>
                    <li>Complete assessments or quizzes</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Contact us for support</li>
                    <li>Participate in forums or discussions</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    This information may include: name, email address, phone number, billing
                    address, payment information, profile picture, and educational preferences.
                  </p>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                    2.2 Automatically Collected Information
                  </h3>
                  <p className="text-muted-foreground">
                    When you access our platform, we automatically collect certain information,
                    including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Usage data (pages visited, time spent, learning progress)</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                {/* How We Use Your Information */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    3. How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We use the information we collect for various purposes, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Providing and maintaining our educational services</li>
                    <li>Personalizing your learning experience</li>
                    <li>Processing payments and transactions</li>
                    <li>Sending administrative information and updates</li>
                    <li>Responding to your inquiries and support requests</li>
                    <li>Analyzing usage patterns to improve our platform</li>
                    <li>Generating certificates and tracking achievements</li>
                    <li>Complying with legal obligations</li>
                  </ul>
                </div>

                {/* Cookies and Tracking */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    4. Cookies and Tracking Technologies
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We use cookies and similar tracking technologies to enhance your experience on
                    our platform:
                  </p>

                  <h3 className="text-lg font-semibold text-foreground mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    Required for the platform to function properly. These cannot be disabled.
                  </p>

                  <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    Help us understand how visitors interact with our platform. You can opt out of
                    these.
                  </p>

                  <h3 className="text-lg font-semibold text-foreground mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">
                    Used to deliver relevant advertisements. You can manage these in your privacy
                    settings.
                  </p>
                </div>

                {/* Data Sharing */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    5. How We Share Your Information
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We may share your information in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>
                      <strong>Service Providers:</strong> With third-party vendors who assist in
                      operating our platform (payment processors, hosting providers, email services)
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law or to protect our
                      rights
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In connection with a merger, acquisition,
                      or sale of assets
                    </li>
                    <li>
                      <strong>With Your Consent:</strong> When you have given us explicit permission
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    We do not sell your personal information to third parties.
                  </p>
                </div>

                {/* Data Security */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
                  <p className="text-muted-foreground">
                    We implement appropriate technical and organizational security measures to
                    protect your personal information, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication mechanisms</li>
                    <li>Regular security assessments and audits</li>
                    <li>Access controls and employee training</li>
                    <li>Encrypted storage of sensitive personal information (PII)</li>
                  </ul>
                </div>

                {/* Data Retention */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain your personal information for as long as necessary to fulfill the
                    purposes outlined in this privacy policy, unless a longer retention period is
                    required or permitted by law. When you close your account, we will delete or
                    anonymize your data within 30 days, except where we are required to retain it
                    for legal or regulatory purposes.
                  </p>
                </div>

                {/* Your Rights (GDPR) */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    8. Your Privacy Rights
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Under applicable data protection laws, including GDPR, you have the following
                    rights:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>
                      <strong>Right to Access:</strong> Request a copy of your personal data
                    </li>
                    <li>
                      <strong>Right to Rectification:</strong> Request correction of inaccurate data
                    </li>
                    <li>
                      <strong>Right to Erasure:</strong> Request deletion of your data ("right to be
                      forgotten")
                    </li>
                    <li>
                      <strong>Right to Portability:</strong> Receive your data in a machine-readable
                      format
                    </li>
                    <li>
                      <strong>Right to Object:</strong> Object to processing of your data
                    </li>
                    <li>
                      <strong>Right to Restrict Processing:</strong> Request limitation of data
                      processing
                    </li>
                    <li>
                      <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    You can exercise these rights through your account settings or by contacting us
                    at{' '}
                    <a href="mailto:privacy@aiborg.ai" className="text-primary hover:underline">
                      privacy@aiborg.ai
                    </a>
                    .
                  </p>
                </div>

                {/* Children's Privacy */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    9. Children's Privacy
                  </h2>
                  <p className="text-muted-foreground">
                    Our platform offers educational content for various age groups, including young
                    learners. For users under 16 years of age, we require parental or guardian
                    consent before collecting personal information. Parents can review, modify, or
                    delete their child's information by contacting us directly.
                  </p>
                </div>

                {/* International Transfers */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    10. International Data Transfers
                  </h2>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than
                    your country of residence. When we transfer data internationally, we ensure
                    appropriate safeguards are in place, including Standard Contractual Clauses
                    approved by relevant authorities.
                  </p>
                </div>

                {/* Third-Party Links */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    11. Third-Party Links
                  </h2>
                  <p className="text-muted-foreground">
                    Our platform may contain links to third-party websites. We are not responsible
                    for the privacy practices of these external sites. We encourage you to review
                    the privacy policies of any third-party sites you visit.
                  </p>
                </div>

                {/* Changes to Policy */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    12. Changes to This Privacy Policy
                  </h2>
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. We will notify you of any
                    material changes by posting the new policy on this page and updating the "Last
                    Updated" date. We encourage you to review this policy periodically.
                  </p>
                </div>

                {/* Contact Us */}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions or concerns about this privacy policy or our data
                    practices, please contact us:
                  </p>
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-muted-foreground">
                      <strong>Aiborg</strong>
                      <br />
                      Email:{' '}
                      <a href="mailto:privacy@aiborg.ai" className="text-primary hover:underline">
                        privacy@aiborg.ai
                      </a>
                      <br />
                      General Inquiries:{' '}
                      <a href="mailto:info@aiborg.ai" className="text-primary hover:underline">
                        info@aiborg.ai
                      </a>
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    This privacy policy is governed by the laws of the United Kingdom. For EU
                    residents, you have the right to lodge a complaint with your local Data
                    Protection Authority.
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
