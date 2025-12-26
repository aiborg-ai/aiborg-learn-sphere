/**
 * NurturingCampaignService
 *
 * Generates and manages lead nurturing email campaigns for SME assessments
 * Pattern: Template-based email generation with scheduled delivery
 * Reference: /src/services/blog/BlogCampaignService.ts
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  SMENurturingCampaign,
  SMENurturingEmail,
  EmailType,
  EmailStatus,
  CampaignStatus,
} from '@/types/aiAssessment';

export class NurturingCampaignService {
  /**
   * Create nurturing campaign for assessment
   */
  static async createCampaign(
    assessmentId: string,
    userId: string,
    companyEmail: string
  ): Promise<void> {
    try {
      const campaign = await this.createCampaignRecord(assessmentId, userId, companyEmail);
      const emails = this.generateEmailSequence(campaign.id, assessmentId);

      await this.saveEmailsToDatabase(emails);

      console.log(`✓ Nurturing campaign created: ${emails.length} emails scheduled`);
    } catch (error) {
      console.error('Error creating nurturing campaign:', error);
      throw error;
    }
  }

  /**
   * Create campaign record
   */
  private static async createCampaignRecord(
    assessmentId: string,
    userId: string,
    companyEmail: string
  ): Promise<SMENurturingCampaign> {
    // Using the imported supabase client

    // Calculate next email scheduled time (24 hours from now for first email)
    const nextEmailDate = new Date();
    nextEmailDate.setHours(nextEmailDate.getHours() + 24);

    const { data, error } = await supabase
      .from('sme_nurturing_campaigns')
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        company_email: companyEmail,
        campaign_status: 'active' as CampaignStatus,
        start_date: new Date().toISOString(),
        next_email_scheduled_at: nextEmailDate.toISOString(),
        emails_sent: 0,
        emails_opened: 0,
        links_clicked: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }

    return data as SMENurturingCampaign;
  }

  /**
   * Generate 7-email sequence
   */
  private static generateEmailSequence(
    campaignId: string,
    assessmentId: string
  ): Omit<SMENurturingEmail, 'id' | 'created_at'>[] {
    const reportUrl = `${import.meta.env.VITE_APP_URL}/sme-assessment/report/${assessmentId}`;

    return [
      {
        campaign_id: campaignId,
        sequence_number: 1,
        email_type: 'welcome' as EmailType,
        subject_line: 'Your AI Readiness Assessment Results',
        email_body: this.generateWelcomeEmail(reportUrl),
        scheduled_days_after_start: 0,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 2,
        email_type: 'education' as EmailType,
        subject_line: 'Understanding Your AI Implementation Journey',
        email_body: this.generateEducationEmail(),
        scheduled_days_after_start: 3,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 3,
        email_type: 'roadmap' as EmailType,
        subject_line: 'Your Personalized AI Implementation Roadmap',
        email_body: this.generateRoadmapEmail(reportUrl),
        scheduled_days_after_start: 7,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 4,
        email_type: 'roi' as EmailType,
        subject_line: 'The Business Case: ROI Analysis',
        email_body: this.generateROIEmail(reportUrl),
        scheduled_days_after_start: 10,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 5,
        email_type: 'case_study' as EmailType,
        subject_line: 'Success Stories: SMEs Like You',
        email_body: this.generateCaseStudyEmail(),
        scheduled_days_after_start: 14,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 6,
        email_type: 'resources' as EmailType,
        subject_line: 'Free Resources to Get Started',
        email_body: this.generateResourcesEmail(),
        scheduled_days_after_start: 18,
        status: 'pending' as EmailStatus,
      },
      {
        campaign_id: campaignId,
        sequence_number: 7,
        email_type: 'consultation' as EmailType,
        subject_line: "Ready to Move Forward? Let's Talk",
        email_body: this.generateConsultationEmail(),
        scheduled_days_after_start: 21,
        status: 'pending' as EmailStatus,
      },
    ];
  }

  /**
   * Email 1: Welcome Email (Day 0)
   */
  private static generateWelcomeEmail(reportUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    ul { padding-left: 20px; }
    li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Your AI Assessment is Complete!</h1>
  </div>

  <div class="content">
    <p>Thank you for completing your AI Readiness Assessment with AiBorg!</p>

    <p>Your comprehensive assessment report is ready. Here's what we've prepared for you:</p>

    <ul>
      <li><strong>📋 Implementation Roadmap</strong> - A phased plan to guide your AI journey from quick wins to long-term transformation</li>
      <li><strong>💰 ROI Analysis</strong> - Quantified business value and investment breakdown with conservative estimates</li>
      <li><strong>🎯 Actionable Next Steps</strong> - Clear priorities to get started immediately</li>
    </ul>

    <p style="text-align: center;">
      <a href="${reportUrl}" class="cta-button">View Your Full Report →</a>
    </p>

    <p>Over the next 3 weeks, we'll send you valuable insights and resources to support your AI implementation journey:</p>

    <ul>
      <li>Educational content about AI for SMEs</li>
      <li>Detailed roadmap breakdown</li>
      <li>ROI justification resources</li>
      <li>Success stories from companies like yours</li>
      <li>Free implementation resources</li>
    </ul>

    <p>Have questions? Simply reply to this email - we're here to help!</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
    <p>You're receiving this email because you completed an AI Readiness Assessment.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 2: Education Email (Day 3)
   */
  private static generateEducationEmail(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .insight-box { background: #f0f4ff; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 Understanding Your AI Journey</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>Based on your assessment, we've identified key opportunities for AI in your organization. But we know the journey can seem overwhelming.</p>

    <h2>Common Challenges We See</h2>
    <ul>
      <li><strong>Uncertainty about where to start</strong> - With so many AI tools available, choosing the right starting point is critical</li>
      <li><strong>Concerns about ROI and costs</strong> - Will the investment pay off? How long will it take?</li>
      <li><strong>Lack of internal AI expertise</strong> - Your team knows your business, but AI might be new territory</li>
      <li><strong>Integration with existing systems</strong> - How does AI fit into your current workflows?</li>
    </ul>

    <div class="insight-box">
      <h3>💡 AiBorg Insight</h3>
      <p>The most successful AI implementations start small with high-impact "quick wins" that build confidence and momentum before tackling larger initiatives.</p>
    </div>

    <h2>How AiBorg Helps</h2>
    <p>Our approach is designed specifically for SMEs:</p>
    <ul>
      <li><strong>Phased Implementation</strong> - Start with quick wins, scale gradually</li>
      <li><strong>Expert Guidance</strong> - We bring the AI expertise so you can focus on your business</li>
      <li><strong>Practical Focus</strong> - Real solutions for real problems, not just technology for its own sake</li>
      <li><strong>Continuous Support</strong> - From planning through implementation and beyond</li>
    </ul>

    <p>In our next email, we'll dive deep into your personalized implementation roadmap.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 3: Roadmap Email (Day 7)
   */
  private static generateRoadmapEmail(reportUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .phase-box { background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗺️ Your AI Implementation Roadmap</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>We've created a step-by-step roadmap based on your specific needs and assessment results. This roadmap breaks down your AI journey into four manageable phases:</p>

    <div class="phase-box">
      <h3>🚀 Phase 1: Quick Wins (Weeks 1-4)</h3>
      <p>Start seeing value immediately with these high-impact initiatives that address your most urgent pain points. These early wins build stakeholder confidence and demonstrate the value of AI.</p>
    </div>

    <div class="phase-box">
      <h3>📈 Phase 2: Short-term (Weeks 5-16)</h3>
      <p>Build on early success by implementing core AI capabilities that directly impact your key user groups. This phase focuses on measurable improvements and initial ROI demonstration.</p>
    </div>

    <div class="phase-box">
      <h3>🎯 Phase 3: Medium-term (Weeks 17-40)</h3>
      <p>Scale successful initiatives across your organization. Integrate AI into key business processes and establish the infrastructure for long-term success.</p>
    </div>

    <div class="phase-box">
      <h3>🌟 Phase 4: Long-term (Weeks 41+)</h3>
      <p>Complete your AI transformation with strategic initiatives that create competitive advantage and establish continuous improvement processes.</p>
    </div>

    <p style="text-align: center;">
      <a href="${reportUrl}#roadmap" class="cta-button">View Your Detailed Roadmap →</a>
    </p>

    <p>Each phase includes specific tasks, resource requirements, success metrics, and estimated costs to help you plan effectively.</p>

    <p>Next email: We'll break down the ROI and show you the expected business value.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 4: ROI Email (Day 10)
   */
  private static generateROIEmail(reportUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .metric-box { background: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 The Business Case for AI</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>Let's talk numbers. Based on your assessment, we've calculated a comprehensive ROI analysis using conservative estimates and industry benchmarks.</p>

    <h2>Your Projected ROI</h2>

    <div class="metric-grid">
      <div class="metric-box">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Investment</div>
        <div class="metric-value">View Report</div>
      </div>
      <div class="metric-box">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Annual Benefit</div>
        <div class="metric-value">View Report</div>
      </div>
      <div class="metric-box">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Payback Period</div>
        <div class="metric-value">View Report</div>
      </div>
      <div class="metric-box">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">3-Year ROI</div>
        <div class="metric-value">View Report</div>
      </div>
    </div>

    <p><em>Note: These are conservative estimates. Many organizations see even better returns as they optimize their AI implementations over time.</em></p>

    <h2>What's Included in the Investment?</h2>
    <ul>
      <li><strong>Implementation Costs</strong> - Initial setup and configuration</li>
      <li><strong>Training</strong> - Getting your team up to speed</li>
      <li><strong>Licensing</strong> - Platform and tool subscriptions</li>
      <li><strong>Infrastructure</strong> - Cloud resources and compute</li>
      <li><strong>Ongoing Support</strong> - Maintenance and optimization</li>
    </ul>

    <h2>Where Does the Value Come From?</h2>
    <ul>
      <li><strong>Efficiency Gains</strong> - Time savings from automation</li>
      <li><strong>Cost Savings</strong> - Reduced operational costs</li>
      <li><strong>Revenue Growth</strong> - Improved customer satisfaction and sales</li>
      <li><strong>Risk Mitigation</strong> - Reduced business risks</li>
      <li><strong>Quality Improvement</strong> - Better products and services</li>
    </ul>

    <p style="text-align: center;">
      <a href="${reportUrl}#roi" class="cta-button">View Detailed ROI Breakdown →</a>
    </p>

    <p>Our ROI calculator includes specific cost and benefit breakdowns based on your assessment responses, giving you the data you need to make an informed decision.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 5: Case Study Email (Day 14)
   */
  private static generateCaseStudyEmail(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .case-study { background: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .result { color: #10b981; font-weight: bold; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Success Stories: SMEs Like You</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>See how other SMEs have successfully implemented AI and achieved measurable results:</p>

    <div class="case-study">
      <h3>Manufacturing Company: Quality Control Automation</h3>
      <p><strong>Challenge:</strong> High defect rates and manual inspection bottlenecks slowing production.</p>
      <p><strong>Solution:</strong> Computer vision AI for automated quality inspection integrated into existing production line.</p>
      <p class="result">✓ Result: 40% reduction in quality defects, 60% faster inspection times, ROI achieved in 8 months</p>
    </div>

    <div class="case-study">
      <h3>Professional Services Firm: Proposal Generation</h3>
      <p><strong>Challenge:</strong> Proposal creation taking 20+ hours per RFP, limiting bid capacity.</p>
      <p><strong>Solution:</strong> AI-powered proposal assistant that learns from past successful proposals.</p>
      <p class="result">✓ Result: 75% reduction in proposal time, 25% increase in win rate, 3x more bids submitted</p>
    </div>

    <div class="case-study">
      <h3>Retail Business: Customer Service Automation</h3>
      <p><strong>Challenge:</strong> Growing customer inquiries overwhelming small support team.</p>
      <p><strong>Solution:</strong> AI chatbot handling common questions, escalating complex issues to humans.</p>
      <p class="result">✓ Result: 70% of inquiries automated, 24/7 support availability, 35% improvement in customer satisfaction</p>
    </div>

    <h2>Common Success Factors</h2>
    <ul>
      <li>Started with clear, measurable pain points</li>
      <li>Began with quick wins to build momentum</li>
      <li>Involved end-users early in the process</li>
      <li>Measured and communicated results regularly</li>
      <li>Scaled successful initiatives across the organization</li>
    </ul>

    <p>Your assessment identified similar opportunities. The roadmap we've created follows these proven success patterns.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 6: Resources Email (Day 18)
   */
  private static generateResourcesEmail(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .resource-box { background: #f0f4ff; padding: 20px; margin: 15px 0; border-radius: 6px; }
    .resource-box h3 { margin-top: 0; color: #4F46E5; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Free Resources to Get Started</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>We've curated a collection of valuable resources to help you move forward with confidence:</p>

    <div class="resource-box">
      <h3>📋 AI Implementation Checklist</h3>
      <p>A comprehensive checklist covering everything from initial planning through launch and optimization. Use this to ensure you don't miss any critical steps.</p>
    </div>

    <div class="resource-box">
      <h3>💰 Budget Planning Template</h3>
      <p>Pre-filled Excel template based on your assessment results, making it easy to build a detailed budget and get stakeholder approval.</p>
    </div>

    <div class="resource-box">
      <h3>🔍 Vendor Evaluation Guide</h3>
      <p>Know what to look for when evaluating AI vendors and service providers. Includes key questions to ask and red flags to watch for.</p>
    </div>

    <div class="resource-box">
      <h3>👥 Team Training Plan</h3>
      <p>A structured approach to getting your team ready for AI. Includes skill assessments, training resources, and change management best practices.</p>
    </div>

    <div class="resource-box">
      <h3>📊 ROI Tracking Dashboard</h3>
      <p>Measure and communicate the impact of your AI initiatives with this ready-to-use dashboard template.</p>
    </div>

    <h2>How to Use These Resources</h2>
    <ol>
      <li>Start with the Implementation Checklist to understand the full scope</li>
      <li>Use the Budget Template to get stakeholder buy-in</li>
      <li>Reference the Vendor Guide when evaluating partners</li>
      <li>Deploy the Training Plan before and during implementation</li>
      <li>Track progress with the ROI Dashboard</li>
    </ol>

    <p>These resources complement your personalized roadmap and ROI analysis, giving you everything you need to move forward.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email 7: Consultation Email (Day 21)
   */
  private static generateConsultationEmail(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .cta-box { background: #fef3c7; border: 2px solid #fbbf24; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center; }
    .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Ready to Move Forward?</h1>
  </div>

  <div class="content">
    <p>Hi there,</p>

    <p>Over the past three weeks, you've received:</p>
    <ul>
      <li>✓ Your comprehensive AI Readiness Assessment results</li>
      <li>✓ A phased implementation roadmap tailored to your needs</li>
      <li>✓ Detailed ROI analysis with conservative estimates</li>
      <li>✓ Success stories from similar organizations</li>
      <li>✓ Free resources to support your journey</li>
    </ul>

    <p><strong>Now it's time to discuss how AiBorg can help you make this vision a reality.</strong></p>

    <div class="cta-box">
      <h2 style="margin-top: 0;">Schedule Your Free 30-Minute Consultation</h2>
      <p>Let's discuss your specific assessment results and how we can help you implement AI in your organization.</p>
      <p>
        <a href="mailto:contact@aiborg.ai?subject=AI Implementation Consultation Request" class="cta-button">Book Your Consultation →</a>
      </p>
    </div>

    <h2>What We'll Cover in the Call:</h2>
    <ul>
      <li><strong>Review Your Results</strong> - Deep dive into your assessment, roadmap, and ROI analysis</li>
      <li><strong>Discuss Your Priorities</strong> - Which quick wins should you tackle first?</li>
      <li><strong>Answer Your Questions</strong> - No question is too technical or too basic</li>
      <li><strong>Outline Next Steps</strong> - If you're ready, we'll map out exactly how to get started</li>
    </ul>

    <h2>No Pressure, No Obligations</h2>
    <p>This consultation is about helping you make the best decision for your business. Whether you choose to work with AiBorg or take a different path, we want you to feel confident in your AI strategy.</p>

    <h2>Not Ready Yet?</h2>
    <p>That's perfectly fine! Feel free to:</p>
    <ul>
      <li>Reply to this email with any questions</li>
      <li>Revisit your assessment results anytime</li>
      <li>Reach out when you're ready to discuss further</li>
    </ul>

    <p>We're here to support you whenever you're ready to take the next step.</p>

    <p>Best regards,<br>
    <strong>The AiBorg Team</strong></p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666;">
      <em>P.S. Your assessment results and roadmap will remain available in your account. You can revisit them anytime at aiborg.ai</em>
    </p>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} AiBorg. All rights reserved.</p>
    <p>Questions? Reply to this email or contact us at contact@aiborg.ai</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Save emails to database
   */
  private static async saveEmailsToDatabase(
    emails: Omit<SMENurturingEmail, 'id' | 'created_at'>[]
  ): Promise<void> {
    // Using the imported supabase client

    const { error } = await supabase.from('sme_nurturing_emails').insert(emails);

    if (error) {
      console.error('Error inserting nurturing emails:', error);
      throw error;
    }
  }

  /**
   * Get campaign by assessment ID
   */
  static async getCampaignByAssessment(assessmentId: string): Promise<SMENurturingCampaign | null> {
    // Using the imported supabase client

    const { data, error } = await supabase
      .from('sme_nurturing_campaigns')
      .select('*, sme_nurturing_emails(*)')
      .eq('assessment_id', assessmentId)
      .single();

    if (error) {
      console.error('Error fetching nurturing campaign:', error);
      return null;
    }

    return data as SMENurturingCampaign;
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    // Using the imported supabase client

    const { error } = await supabase
      .from('sme_nurturing_campaigns')
      .update({
        campaign_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
  }
}
