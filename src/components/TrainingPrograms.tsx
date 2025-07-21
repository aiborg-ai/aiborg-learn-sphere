import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonalization, AUDIENCE_CONFIG } from "@/contexts/PersonalizationContext";
import { EnrollmentForm } from "@/components/EnrollmentForm";
import { CourseDetailsModal } from "@/components/CourseDetailsModal";
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  Award, 
  ArrowRight,
  BookOpen,
  Video,
  Monitor,
  MapPin
} from "lucide-react";

const programs = [
  // Primary School Courses (1-25)
  {
    id: 1,
    title: "Kickstarter AI Adventures",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "4th August",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "AI Fundamentals",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 2,
    title: "Ethical AI for Young Minds",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Ethics & Safety",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 3,
    title: "Creative Robots Coding Jam",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 4,
    title: "AI Storytellers' Studio",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 5,
    title: "My First Neural Network",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "AI Fundamentals",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 6,
    title: "Smart Sensors & Toy Bots",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 7,
    title: "AI Heroes & Villains",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Ethics & Safety",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 8,
    title: "Machine Music Makers",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 9,
    title: "Picture Perfect AI",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Computer Vision",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 10,
    title: "Data Detectives",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Data Science",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 11,
    title: "Chatbot Buddies",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Conversational AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 12,
    title: "AR Treasure Hunt AI",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "AR/VR",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 13,
    title: "AI & Planet Earth",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Environmental AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 14,
    title: "Learning with RoboPets",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 15,
    title: "Code a Talking Turtle",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Programming",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 16,
    title: "AI Math Magic",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Mathematics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 17,
    title: "Virtual Zoo Keepers",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Simulation",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 18,
    title: "Language Translator Fun",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Language Processing",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 19,
    title: "Art with Algorithms",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 20,
    title: "AI Weather Wizards",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Prediction",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 21,
    title: "Digital Safety with AI",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Cybersecurity",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 22,
    title: "AI & Healthy Habits",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Health Tech",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 23,
    title: "Junior Cyber Detectives",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Cybersecurity",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 24,
    title: "Build a Voice Assistant Jr.",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Voice AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 25,
    title: "Robo-Rescue Missions",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },

  // Secondary School Courses (26-50)
  {
    id: 26,
    title: "Ultimate Academic Advantage by AI",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "4th August",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Academic Enhancement",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 27,
    title: "Teen Machine Learning Bootcamp",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Machine Learning",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 28,
    title: "Code Your Own ChatGPT",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Conversational AI",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 29,
    title: "AI Game Design Challenge",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Game Development",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 30,
    title: "Vision Hack Lab",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Computer Vision",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 31,
    title: "Data Science for Teens",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Data Science",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 32,
    title: "AI & Social Good Projects",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Social Impact",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 33,
    title: "GenAI Music Producer",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Creative AI",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 34,
    title: "AI Startup Simulation",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Entrepreneurship",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 35,
    title: "Cybersecurity AI Defender",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Cybersecurity",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 36,
    title: "Autonomous Drone Programming",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Robotics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 37,
    title: "AI-powered Science Fair",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Science",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 38,
    title: "Ethics & Bias Debugathon",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Ethics & Safety",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 39,
    title: "AI for Exam Prep",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Academic Enhancement",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 40,
    title: "Sentiment Analyzer Build",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Natural Language Processing",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 41,
    title: "Predictive Sports Analytics",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Sports Analytics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 42,
    title: "Smart Home Automation Coding",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "IoT",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 43,
    title: "AR/VR with AI",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "AR/VR",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 44,
    title: "Bioinformatics for Beginners",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Bioinformatics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 45,
    title: "Design Thinking with AI",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Design",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 46,
    title: "Finance Forecasting Mini-Camp",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Finance",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 47,
    title: "AI Journalism Workshop",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Journalism",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 48,
    title: "Sustainable Cities with AI",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Sustainability",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 49,
    title: "AI Poetry & Language Lab",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Creative Writing",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 50,
    title: "Neural Network Art Studio",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    category: "Creative AI",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },

  // Professional Courses (51-75)
  {
    id: 51,
    title: "Boost Productivity with Generative AI",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "4th August",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Productivity",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 52,
    title: "Generative AI for Software Developers",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "4th August",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Software Development",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 53,
    title: "Generative AI for Product Managers",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "4th August",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Product Management",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 54,
    title: "Applied NLP in Business",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Natural Language Processing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 55,
    title: "Computer Vision in Manufacturing",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Computer Vision",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 56,
    title: "AI for Marketing Professionals",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Marketing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 57,
    title: "Responsible AI Governance",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Governance",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 58,
    title: "Data Engineering with ML Pipelines",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Data Engineering",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 59,
    title: "Edge AI for IoT Engineers",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "IoT",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 60,
    title: "AI-driven Cybersecurity Ops",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Cybersecurity",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 61,
    title: "Financial Modeling with ML",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Finance",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 62,
    title: "Healthcare AI Applications",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Healthcare",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 63,
    title: "HR Analytics & Talent AI",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Human Resources",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 64,
    title: "Supply Chain Optimization AI",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Supply Chain",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 65,
    title: "Retail Personalization Engines",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Retail",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 66,
    title: "Conversational AI Design Sprint",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Conversational AI",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 67,
    title: "Recommendation Systems Workshop",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Recommendation Systems",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 68,
    title: "Cloud ML Deployment Bootcamp",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Cloud Computing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 69,
    title: "MLOps Essentials",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "MLOps",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 70,
    title: "AI Quality Assurance & Testing",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Quality Assurance",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 71,
    title: "Customer Insights with AI",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Customer Analytics",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 72,
    title: "Language Model Fine-tuning Lab",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Natural Language Processing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 73,
    title: "Autonomous Vehicles Overview",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Autonomous Systems",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 74,
    title: "Time Series Forecasting Mastery",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Advanced",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Time Series Analysis",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 75,
    title: "AI Strategy for Executives",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£79",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    category: "Strategy",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },

  // SME Courses (76-100)
  {
    id: 76,
    title: "AI Opportunity Assessment",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "4th August",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Business Assessment",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 77,
    title: "AI for Business Transformation",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "4th August",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Business Transformation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 78,
    title: "No-Code AI Automations",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "4th August",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Automation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 79,
    title: "Small Business Chatbot Builder",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Chatbots",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 80,
    title: "E-commerce Personalization Quick-Win",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "E-commerce",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 81,
    title: "AI-Enhanced Customer Support",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Customer Support",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 82,
    title: "Predictive Inventory for Retail",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Inventory Management",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 83,
    title: "Fraud Detection for SMEs",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Fraud Detection",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 84,
    title: "Local Marketing with AI Insights",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Marketing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 85,
    title: "Workflow Automation Blueprint",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Workflow Automation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 86,
    title: "Predictive Maintenance for SMB Manufacturing",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Predictive Maintenance",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 87,
    title: "AI-Driven Sales Funnel Optimizer",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Sales Optimization",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 88,
    title: "HR Chatbot for Hiring",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "HR Automation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 89,
    title: "Decision Dashboards with AutoML",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Business Intelligence",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 90,
    title: "Generative Content for Branding",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Content Generation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 91,
    title: "AI-Powered Email Campaigns",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Beginner",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Email Marketing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 92,
    title: "Voice Commerce Enablement",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Voice Commerce",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 93,
    title: "Store Traffic Analytics via Vision AI",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Retail Analytics",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 94,
    title: "Financial Risk Scoring Lite",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Risk Management",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 95,
    title: "Sustainability Tracking AI",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Sustainability",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 96,
    title: "AI ROI Measurement Clinic",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "ROI Measurement",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 97,
    title: "Personalized Training Bots for Staff",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Training & Development",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 98,
    title: "Data Readiness Workshop",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Data Strategy",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 99,
    title: "AI Compliance Essentials",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Compliance",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 100,
    title: "Future-proof Your Business with AI",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "SME",
    mode: "Online",
    duration: "4 weeks",
    price: "£49",
    level: "Intermediate",
    startDate: "Enquire for start date",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    category: "Future Strategy",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  }
];

export function TrainingPrograms() {
  const { selectedAudience } = usePersonalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [localSelectedAudience, setLocalSelectedAudience] = useState("currently-enrolling");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Use local state for audience selection
  const activeAudience = localSelectedAudience;

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Fix audience matching - convert tab value to proper case
    const audienceMap: { [key: string]: string } = {
      "primary": "Primary",
      "secondary": "Secondary", 
      "professional": "Professional",
      "business": "SME"
    };
    const expectedAudience = audienceMap[activeAudience] || activeAudience;
    const matchesAudience = activeAudience === "all" || program.audience === expectedAudience;
    const matchesMode = selectedMode === "all" || program.mode === selectedMode;
    const matchesLevel = selectedLevel === "all" || program.level === selectedLevel;
    
    return matchesSearch && matchesAudience && matchesMode && matchesLevel;
  });

  const handleLearnMore = (course: any) => {
    setSelectedCourse(course);
    setDetailsOpen(true);
  };

  const handleEnrollNow = (course: any) => {
    setSelectedCourse(course);
    setEnrollmentOpen(true);
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "Primary":
        return "Young Learners (Ages 5-11)";
      case "Secondary":
        return "Teens & Students (Ages 12-18)";
      case "Professional":
        return "Working Professionals";
      case "SME":
        return "Small & Medium Enterprises";
      default:
        return audience;
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "Primary":
        return "🎨";
      case "Secondary":
        return "🚀";
      case "Professional":
        return "💼";
      case "SME":
        return "🏢";
      default:
        return "📚";
    }
  };

  // Group programs by audience
  const programsByAudience = {
    Primary: programs.filter(p => p.audience === "Primary"),
    Secondary: programs.filter(p => p.audience === "Secondary"),
    Professional: programs.filter(p => p.audience === "Professional"),
    SME: programs.filter(p => p.audience === "SME")
  };

  // Get programs that are currently enrolling (have specific start dates, not "Enquire for start date")
  const currentlyEnrollingPrograms = programs.filter(program => 
    program.startDate !== "Enquire for start date" && program.startDate.trim() !== ""
  );

  return (
    <section className="py-20 bg-gradient-to-b from-background via-background/95 to-secondary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Training Programs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose from our comprehensive range of AI courses designed for every skill level and industry.
          </p>
        </div>

        {/* Audience Tabs */}
        <Tabs value={activeAudience} onValueChange={setLocalSelectedAudience} className="mb-12">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-8">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Programs
            </TabsTrigger>
            <TabsTrigger value="currently-enrolling" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Currently Enrolling</span>
              <span className="sm:hidden">Enrolling</span>
            </TabsTrigger>
            {[
              { key: "primary", label: "Young Learners" },
              { key: "secondary", label: "Teens & Students" },
              { key: "professional", label: "Professionals" },
              { key: "business", label: "SMEs" }
            ].map(({ key, label }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <span>{getAudienceIcon(key)}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{key}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Delivery Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="In-person">In-person</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Difficulty Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Programs Grid */}
          <TabsContent value={activeAudience} className="space-y-8">
            {activeAudience === "all" ? (
              // Show all programs grouped by audience
              Object.entries(programsByAudience).map(([audienceKey, audiencePrograms]) => (
                <div key={audienceKey} className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <span className="text-2xl">{getAudienceIcon(audienceKey)}</span>
                    <h3 className="text-2xl font-bold">{getAudienceLabel(audienceKey)}</h3>
                    <Badge variant="secondary">{audiencePrograms.length} courses</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {audiencePrograms
                      .filter(program => {
                        const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           program.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           program.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
                        const matchesMode = selectedMode === "all" || program.mode === selectedMode;
                        const matchesLevel = selectedLevel === "all" || program.level === selectedLevel;
                        return matchesSearch && matchesMode && matchesLevel;
                      })
                      .map((program) => (
                        <Card key={program.id} className="p-6 hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {program.category}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    <span className="text-xs text-muted-foreground">{program.mode}</span>
                                  </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{program.title}</h3>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-primary">{program.price}</div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {program.duration}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant="outline">{program.level}</Badge>
                              <span className="text-muted-foreground">
                                {program.startDate}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1 mt-4">
                              {program.keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1 btn-hero group" onClick={() => handleEnrollNow(program)}>
                              Enroll Now
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleLearnMore(program)}>
                              Learn More
                            </Button>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              ))
            ) : activeAudience === "currently-enrolling" ? (
              // Show currently enrolling programs
              <>
                <div className="flex items-center gap-3 pb-4 border-b mb-6">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-bold">Currently Enrolling Programs</h3>
                  <Badge variant="secondary">{currentlyEnrollingPrograms.length} courses</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentlyEnrollingPrograms.map((program) => (
                    <Card key={program.id} className="p-6 hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {program.category}
                              </Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                Starts {program.startDate}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground line-clamp-2">{program.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{program.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {program.duration}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            {program.mode}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Award className="h-3 w-3" />
                            {program.level}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-primary">{program.price}</span>
                          <Badge variant="outline" className="text-xs">
                            {getAudienceLabel(program.audience)}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 btn-hero group" onClick={() => handleEnrollNow(program)}>
                            Enroll Now
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleLearnMore(program)}>
                            Learn More
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              // Show filtered programs for specific audience
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program) => (
                  <Card key={program.id} className="p-6 hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {program.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">{program.mode}</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{program.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary">{program.price}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {program.duration}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{program.level}</Badge>
                        <span className="text-muted-foreground">
                          {program.startDate}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mt-4">
                        {program.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 btn-hero group" onClick={() => handleEnrollNow(program)}>
                        Enroll Now
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleLearnMore(program)}>
                        Learn More
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No programs found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setLocalSelectedAudience("all");
              setSelectedMode("all");
              setSelectedLevel("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pricing Notice */}
        <div className="text-center mt-16">
          <Card className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
            <div className="flex items-center gap-2 text-2xl font-bold text-secondary mb-2">
              <Award className="h-6 w-6" />
              £49
            </div>
            <p className="text-sm text-muted-foreground">
              Average course price • Full access • Certification included
            </p>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedCourse && (
        <>
          <CourseDetailsModal
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onEnroll={() => handleEnrollNow(selectedCourse)}
            course={{
              name: selectedCourse.title,
              category: selectedCourse.category,
              audience: selectedCourse.audience,
              level: selectedCourse.level,
              duration: selectedCourse.duration,
              mode: selectedCourse.mode,
              keywords: selectedCourse.keywords,
              description: selectedCourse.description,
              point1: selectedCourse.features[0] || "",
              point2: selectedCourse.features[1] || "",
              point3: selectedCourse.features[2] || "",
              point4: selectedCourse.features[3] || "",
              startDate: selectedCourse.startDate,
              price: selectedCourse.price
            }}
          />
          <EnrollmentForm
            isOpen={enrollmentOpen}
            onClose={() => setEnrollmentOpen(false)}
            courseName={selectedCourse.title}
            coursePrice={selectedCourse.price}
          />
        </>
      )}
    </section>
  );
}