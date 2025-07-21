import { Audience, usePersonalization } from "@/contexts/PersonalizationContext";
import { ConversationContext } from "./ChatContext";
import { 
  getWelcomeMessage, 
  getExperienceFollowUp, 
  getCourseRecommendationTemplate, 
  getPricingResponse,
  getContextualFollowUp 
} from "./PersonalizedResponses";

// Course data for accurate recommendations
const professionalCourses = [
  { title: "AI Fundamentals for Professionals", price: "£89", duration: "8 weeks", level: "Intermediate" },
  { title: "Advanced Prompt Engineering", price: "£129", duration: "6 weeks", level: "Advanced" },
  { title: "AI Strategy & Implementation", price: "£199", duration: "10 weeks", level: "Advanced" },
  { title: "Machine Learning for Business", price: "£159", duration: "8 weeks", level: "Intermediate" }
];

const businessCourses = [
  { title: "AI Leadership & Strategy", price: "£299", duration: "12 weeks", level: "Executive" },
  { title: "Enterprise AI Implementation", price: "£499", duration: "16 weeks", level: "Executive" },
  { title: "AI ROI & Analytics", price: "£199", duration: "8 weeks", level: "Advanced" }
];

const secondaryCourses = [
  { title: "Ultimate Academic Advantage by AI", price: "£39", duration: "6 weeks", level: "Intermediate" },
  { title: "Teen Machine Learning Bootcamp", price: "£39", duration: "6 weeks", level: "Intermediate" },
  { title: "Code Your Own ChatGPT", price: "£39", duration: "6 weeks", level: "Intermediate" }
];

const primaryCourses = [
  { title: "Kickstarter AI Adventures", price: "£25", duration: "4 weeks", level: "Beginner" },
  { title: "Creative Robots Coding Jam", price: "£25", duration: "4 weeks", level: "Beginner" },
  { title: "AI Storytellers' Studio", price: "£25", duration: "4 weeks", level: "Beginner" }
];

export class ChatResponseGenerator {
  private selectedAudience: Audience;
  private getPersonalizedContent: (content: any) => any;
  private conversationContext: ConversationContext;
  private updateContext: (updates: Partial<ConversationContext>) => void;

  constructor(
    selectedAudience: Audience,
    getPersonalizedContent: (content: any) => any,
    conversationContext: ConversationContext,
    updateContext: (updates: Partial<ConversationContext>) => void
  ) {
    this.selectedAudience = selectedAudience;
    this.getPersonalizedContent = getPersonalizedContent;
    this.conversationContext = conversationContext;
    this.updateContext = updateContext;
  }

  private getCourseRecommendations() {
    switch (this.selectedAudience) {
      case "professional":
        return professionalCourses;
      case "business": 
        return businessCourses;
      case "secondary":
        return secondaryCourses;
      case "primary":
        return primaryCourses;
      default:
        return professionalCourses;
    }
  }

  private getPriceRange(): string {
    switch (this.selectedAudience) {
      case "business": return "£199 to £499";
      case "professional": return "£89 to £199";
      case "secondary": return "£39";
      case "primary": return "£25";
      default: return "£25 to £499";
    }
  }

  private detectUserExperience(userMessage: string): 'beginner' | 'intermediate' | 'advanced' | undefined {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("no experience") || lowerMessage.includes("beginner") || 
        lowerMessage.includes("new to") || lowerMessage.includes("never used")) {
      return 'beginner';
    }
    
    if (lowerMessage.includes("some experience") || lowerMessage.includes("intermediate") || 
        lowerMessage.includes("used before") || lowerMessage.includes("familiar")) {
      return 'intermediate';
    }
    
    if (lowerMessage.includes("advanced") || lowerMessage.includes("expert") || 
        lowerMessage.includes("professional experience") || lowerMessage.includes("years of")) {
      return 'advanced';
    }
    
    return undefined;
  }

  private detectUserRole(userMessage: string): string | undefined {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("developer") || lowerMessage.includes("programmer")) return "developer";
    if (lowerMessage.includes("manager") || lowerMessage.includes("lead")) return "manager";
    if (lowerMessage.includes("analyst") || lowerMessage.includes("data")) return "analyst";
    if (lowerMessage.includes("teacher") || lowerMessage.includes("educator")) return "educator";
    if (lowerMessage.includes("student")) return "student";
    if (lowerMessage.includes("ceo") || lowerMessage.includes("executive")) return "executive";
    
    return undefined;
  }

  generateResponse(userMessage: string, isFirstMessage: boolean = false): string {
    const lowerMessage = userMessage.toLowerCase();

    // First message - personalized welcome
    if (isFirstMessage) {
      return this.getPersonalizedContent(getWelcomeMessage());
    }

    // Detect and store user information
    const experience = this.detectUserExperience(userMessage);
    const role = this.detectUserRole(userMessage);
    
    if (experience && !this.conversationContext.userExperienceLevel) {
      this.updateContext({ userExperienceLevel: experience });
    }
    
    if (role && !this.conversationContext.userRole) {
      this.updateContext({ userRole: role });
    }

    // Handle specific queries with context
    if (lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      const priceRange = this.getPriceRange();
      this.updateContext({ lastTopic: "pricing" });
      return this.getPersonalizedContent(getPricingResponse(priceRange));
    }

    // Professional asking about intermediate courses
    if (lowerMessage.includes("intermediate") && this.selectedAudience === "professional") {
      const course = this.getCourseRecommendations()[0];
      this.updateContext({ 
        lastTopic: "course_recommendation",
        recommendedCourses: [course.title]
      });
      return this.getPersonalizedContent(
        getCourseRecommendationTemplate(course.title, course.price, course.duration)
      );
    }

    // Course recommendations with context
    if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest") || 
        (lowerMessage.includes("course") && lowerMessage.includes("which"))) {
      
      const courses = this.getCourseRecommendations();
      const course = courses[0]; // Primary recommendation
      
      this.updateContext({ 
        lastTopic: "course_recommendation",
        recommendedCourses: [course.title]
      });

      // Professional with specific background
      if (this.selectedAudience === "professional" && 
          (lowerMessage.includes("software") || this.conversationContext.userRole === "developer")) {
        
        return `As a software professional, I recommend these courses based on your background:\n\n1. **${courses[0].title}** (${courses[0].price}, ${courses[0].duration}) - Perfect for your technical background\n2. **${courses[1].title}** (${courses[1].price}, ${courses[1].duration}) - Advanced skills for immediate application\n3. **${courses[2].title}** (${courses[2].price}, ${courses[2].duration}) - Strategic implementation\n\nAll include CPE credits and industry certificates. Which interests you most?`;
      }

      return this.getPersonalizedContent(
        getCourseRecommendationTemplate(course.title, course.price, course.duration)
      );
    }

    // Experience-based follow-up
    if (!this.conversationContext.askedAboutExperience && 
        (lowerMessage.includes("experience") || experience)) {
      
      this.updateContext({ askedAboutExperience: true });
      return this.getPersonalizedContent(getExperienceFollowUp(experience));
    }

    // Certificate inquiry
    if (lowerMessage.includes("certificate") || lowerMessage.includes("certification")) {
      this.updateContext({ lastTopic: "certification" });
      return this.getPersonalizedContent({
        primary: "Yes! You'll get awesome certificates to show your family and friends how smart you are with AI! 🏆",
        secondary: "Absolutely! Our certificates are recognized by universities and look great on college applications. Perfect for your academic portfolio! 📜",
        professional: "Yes! All courses include industry-recognized certificates with CPE credits. Showcase your AI expertise on LinkedIn and advance your career. 💼",
        business: "Our executive certificates demonstrate strategic AI leadership to stakeholders and boards. Includes completion verification for HR systems. 📊",
        default: "Yes, all programs include certificates upon completion with practical skills verification."
      });
    }

    // Contextual follow-up based on conversation
    if (this.conversationContext.lastTopic === "course_recommendation") {
      if (lowerMessage.includes("yes") || lowerMessage.includes("interested") || 
          lowerMessage.includes("more")) {
        return this.getPersonalizedContent({
          primary: "Yay! 🎉 This course has super fun activities like building your first AI friend, creating magic art, and solving puzzles! You'll even get to show your projects to other kids! When would you like to start?",
          secondary: "Awesome! 🚀 The course includes 6 hands-on projects, live coding sessions, access to our teen community, and a portfolio piece for college applications. We have sessions starting every 2 weeks. What's your preferred schedule?",
          professional: "Excellent! The program includes 8 modules covering LLM fundamentals, prompt engineering, implementation strategies, and real-world case studies. You'll also get access to our professional network and job placement assistance. When would you like to begin?",
          business: "Perfect! This executive program includes strategic planning workshops, ROI calculators, team training materials, and a dedicated success manager. We'll also create a custom implementation roadmap for your organization. Shall we schedule a consultation?",
          default: "Great! I can provide more details about the curriculum and help you get started."
        });
      }
    }

    // Generate contextual follow-up based on user input
    const followUp = getContextualFollowUp(userMessage, this.selectedAudience);
    
    // Default personalized response with context
    return this.getPersonalizedContent({
      primary: followUp || "That's super interesting! 🌟 Tell me more about what you like to do!",
      secondary: followUp || "That's great! 🎯 How do you think AI could help with your interests?",
      professional: followUp || "I understand. How can AI best support your professional objectives?",
      business: followUp || "That's valuable insight. What are your key success metrics for AI implementation?",
      default: "I'd be happy to help you with that! What specific aspects would you like to explore?"
    });
  }
}