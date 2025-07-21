import { Audience } from "@/contexts/PersonalizationContext";

export interface ResponseTemplate {
  primary: string;
  secondary: string;
  professional: string;
  business: string;
  default: string;
}

export const getWelcomeMessage = (): ResponseTemplate => ({
  primary: "Hi there! I'm aiborg chat! 🤖 I'm super excited to help you learn about AI in fun ways! What's your name, and do you like playing games or building things?",
  secondary: "Hey! I'm aiborg chat, your AI learning companion! 🚀 I can help you discover awesome AI courses that'll boost your grades and prepare you for the future. What subjects are you most interested in?",
  professional: "Hello! I'm aiborg chat, your professional AI learning assistant. I can help you find courses that will enhance your career and provide practical AI skills for your workplace. What's your current role, and what would you like to achieve with AI?",
  business: "Welcome! I'm aiborg chat, your strategic AI learning advisor. I help executives and business leaders understand AI implementation, ROI, and organizational transformation. What are your primary business objectives with AI?",
  default: "Hello! I'm aiborg chat, your AI learning assistant. I can help you find the perfect course and answer questions about our programs. What would you like to learn about AI?"
});

export const getExperienceFollowUp = (experienceLevel?: string): ResponseTemplate => ({
  primary: experienceLevel === 'beginner' 
    ? "That's perfect! Everyone starts somewhere! 🌟 Do you like drawing, telling stories, or maybe playing with robots? I have some amazing AI adventures that are like games!"
    : "Wow, you already know some things about AI! That's awesome! 🎉 What's your favorite thing about technology?",
  secondary: experienceLevel === 'beginner'
    ? "No worries at all! Starting fresh is actually great - you'll learn everything the right way! 📚 Are you thinking about using AI for school projects, college prep, or just personal interest?"
    : "Nice! Having some background will help you jump into the more exciting stuff faster! 🎯 What specific areas interest you most - coding, data science, or creative AI?",
  professional: experienceLevel === 'beginner'
    ? "Perfect! Our professional courses are designed for busy professionals starting their AI journey. Many successful participants come from non-technical backgrounds. What's your main goal - enhancing current work, career advancement, or preparing for AI integration in your industry?"
    : "Excellent! With your foundation, we can focus on advanced applications and strategic implementation. What specific AI applications are most relevant to your current role?",
  business: experienceLevel === 'beginner'
    ? "That's exactly who our executive programs are designed for! We focus on strategic understanding, not technical details. Are you looking to evaluate AI opportunities, lead digital transformation, or understand competitive implications?"
    : "Great! Your existing knowledge will help you make strategic decisions faster. Are you focused on implementation strategy, team training, or measuring AI ROI?",
  default: "Thanks for sharing that! What specific aspects of AI are you most interested in exploring?"
});

export const getCourseRecommendationTemplate = (courseName: string, price: string, duration: string): ResponseTemplate => ({
  primary: `I think you'd love **${courseName}**! 🎮 It's only ${price} and takes ${duration} of fun learning! You'll get to play games, create cool projects, and even get a special certificate to show everyone how smart you are! Would you like me to tell you more about the fun activities?`,
  secondary: `I'd definitely recommend **${courseName}** (${price}, ${duration})! 🚀 This course is perfect for your level and includes hands-on coding projects that look amazing on college applications. Plus, you'll join our active teen community where you can collaborate on projects. Want to know more about the curriculum?`,
  professional: `Based on your background, I highly recommend **${courseName}** (${price}, ${duration}). This course provides practical skills you can implement immediately at work, includes CPE credits, and offers networking opportunities with other professionals. The ROI is typically seen within the first month. Would you like details about the specific modules?`,
  business: `For your strategic objectives, **${courseName}** (${price}, ${duration}) would be ideal. This executive-level program focuses on implementation strategy, team leadership, and measurable business outcomes. Includes analytics dashboard and dedicated support for organizational rollout. Shall I outline the business case and expected ROI?`,
  default: `I recommend **${courseName}** (${price}, ${duration}). This course includes comprehensive materials and practical applications. Would you like more information?`
});

export const getPricingResponse = (priceRange: string): ResponseTemplate => ({
  primary: `Our super fun AI courses are just ${priceRange}! 🎨 That's less than a video game, but you learn skills that last forever! Each course has games, fun projects, certificates, and you get to show your family all the cool things you build! Plus, if you don't love it, we'll give your money back!`,
  secondary: `Our courses are ${priceRange}, which is amazing value compared to other tech programs! 📊 You get everything: live sessions with instructors, hands-on coding projects, industry certificates that colleges love, access to our teen community, and lifetime access to materials. Many students say it's the best investment they've made for their future!`,
  professional: `Our professional courses range from ${priceRange} and deliver exceptional ROI. 📈 This includes CPE credits (worth $200+ alone), industry-recognized certificates, practical skills that increase earning potential by 15-30%, networking opportunities, and implementation support. Most professionals see career advancement within 6 months. Payment plans available.`,
  business: `Our enterprise programs range from ${priceRange} with proven ROI of 300-500% within 12 months. 💼 This includes custom training for your team, analytics dashboards, dedicated success manager, implementation support, and measurable performance metrics. We also offer volume discounts for larger teams and flexible enterprise contracts.`,
  default: `Our courses range from ${priceRange} and include comprehensive materials, certificates, and ongoing support.`
});

export const getContextualFollowUp = (userMessage: string, audience: Audience): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (audience === "primary") {
    if (lowerMessage.includes("game") || lowerMessage.includes("play")) {
      return "I love that you like games! 🎮 Our AI courses are designed like fun games with challenges, rewards, and cool projects. What's your favorite type of game?";
    }
    if (lowerMessage.includes("draw") || lowerMessage.includes("art")) {
      return "That's amazing! 🎨 We have AI courses where you can teach computers to make art, create stories with pictures, and even design your own characters! Would you like to hear about our AI art adventures?";
    }
    return "That sounds really cool! 🌟 What other things do you like to do for fun?";
  }
  
  if (audience === "secondary") {
    if (lowerMessage.includes("college") || lowerMessage.includes("university")) {
      return "Smart thinking! 🎓 AI skills are becoming essential for almost every field. Which subjects or careers are you considering? I can show you how AI applies to everything from medicine to gaming!";
    }
    if (lowerMessage.includes("project") || lowerMessage.includes("code")) {
      return "Perfect! 💻 Our courses include portfolio-worthy projects that really impress colleges and employers. Are you interested in web development, data science, or maybe AI game development?";
    }
    return "That's a great direction! 🚀 How do you see AI fitting into your future plans?";
  }
  
  if (audience === "professional") {
    if (lowerMessage.includes("manager") || lowerMessage.includes("lead")) {
      return "Excellent! As a leader, you'll benefit from understanding both technical implementation and team management aspects of AI. Are you looking to upskill your team or integrate AI into existing workflows?";
    }
    if (lowerMessage.includes("developer") || lowerMessage.includes("engineer")) {
      return "Perfect! With your technical background, we can focus on advanced AI applications and implementation strategies. Are you interested in LLMs, machine learning, or AI system architecture?";
    }
    return "That's valuable context! How do you envision AI enhancing your current role or opening new opportunities?";
  }
  
  if (audience === "business") {
    if (lowerMessage.includes("ceo") || lowerMessage.includes("executive")) {
      return "Strategic AI leadership is crucial for competitive advantage. Are you focused on operational efficiency, new product development, or market positioning with AI?";
    }
    if (lowerMessage.includes("transform") || lowerMessage.includes("strategy")) {
      return "Digital transformation requires the right approach. Are you looking to transform customer experience, internal operations, or create new AI-powered revenue streams?";
    }
    return "Understanding the business impact is key. What are your primary objectives for AI implementation in your organization?";
  }
  
  return "That's helpful to know! What specific aspects of AI interest you most?";
};