import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePersonalization, AUDIENCE_CONFIG } from "@/contexts/PersonalizationContext";
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Calendar, 
  Star, 
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
    title: "Kickstarter AI Adventures™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 450,
    level: "Beginner",
    startDate: "2025-02-01",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Ms. Emma Thompson",
    category: "AI Fundamentals",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 2,
    title: "Ethical AI for Young Minds™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 380,
    level: "Beginner",
    startDate: "2025-02-08",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Dr. Sarah Wilson",
    category: "Ethics & Safety",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 3,
    title: "Creative Robots Coding Jam™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 520,
    level: "Beginner",
    startDate: "2025-02-15",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Mr. James Robot",
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 4,
    title: "AI Storytellers' Studio™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 340,
    level: "Beginner",
    startDate: "2025-02-22",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Ms. Luna Stories",
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 5,
    title: "My First Neural Network™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 290,
    level: "Beginner",
    startDate: "2025-03-01",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Prof. Net Neural",
    category: "AI Fundamentals",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 6,
    title: "Smart Sensors & Toy Bots™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 410,
    level: "Beginner",
    startDate: "2025-03-08",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Dr. Sensor Bot",
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 7,
    title: "AI Heroes & Villains™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.6,
    students: 360,
    level: "Beginner",
    startDate: "2025-03-15",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Captain AI Good",
    category: "Ethics & Safety",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 8,
    title: "Machine Music Makers™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 320,
    level: "Beginner",
    startDate: "2025-03-22",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Maestro Melody AI",
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 9,
    title: "Picture Perfect AI™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 380,
    level: "Beginner",
    startDate: "2025-03-29",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Ms. Pixel Perfect",
    category: "Computer Vision",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 10,
    title: "Data Detectives™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 470,
    level: "Beginner",
    startDate: "2025-04-05",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Detective Data",
    category: "Data Science",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 11,
    title: "Chatbot Buddies™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 330,
    level: "Beginner",
    startDate: "2025-04-12",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Buddy ChatBot",
    category: "Conversational AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 12,
    title: "AR Treasure Hunt AI™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 290,
    level: "Beginner",
    startDate: "2025-04-19",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Explorer AR",
    category: "AR/VR",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 13,
    title: "AI & Planet Earth™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 410,
    level: "Beginner",
    startDate: "2025-04-26",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Dr. Earth Green",
    category: "Environmental AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 14,
    title: "Learning with RoboPets™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 390,
    level: "Beginner",
    startDate: "2025-05-03",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "RoboPet Trainer",
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 15,
    title: "Code a Talking Turtle™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.6,
    students: 280,
    level: "Beginner",
    startDate: "2025-05-10",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Turtle Code Master",
    category: "Programming",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 16,
    title: "AI Math Magic™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 350,
    level: "Beginner",
    startDate: "2025-05-17",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Prof. Math Magic",
    category: "Mathematics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 17,
    title: "Virtual Zoo Keepers™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 320,
    level: "Beginner",
    startDate: "2025-05-24",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Zookeeper AI",
    category: "Simulation",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 18,
    title: "Language Translator Fun™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 370,
    level: "Beginner",
    startDate: "2025-05-31",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Translator Bot",
    category: "Language Processing",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 19,
    title: "Art with Algorithms™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 440,
    level: "Beginner",
    startDate: "2025-06-07",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Artist Algorithm",
    category: "Creative AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 20,
    title: "AI Weather Wizards™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 310,
    level: "Beginner",
    startDate: "2025-06-14",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Weather Wizard",
    category: "Prediction",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 21,
    title: "Digital Safety with AI™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 420,
    level: "Beginner",
    startDate: "2025-06-21",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Safety Guardian",
    category: "Cybersecurity",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 22,
    title: "AI & Healthy Habits™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.6,
    students: 260,
    level: "Beginner",
    startDate: "2025-06-28",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Dr. Healthy AI",
    category: "Health Tech",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 23,
    title: "Junior Cyber Detectives™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.9,
    students: 380,
    level: "Beginner",
    startDate: "2025-07-05",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Cyber Detective",
    category: "Cybersecurity",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 24,
    title: "Build a Voice Assistant Jr.™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.8,
    students: 340,
    level: "Beginner",
    startDate: "2025-07-12",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Voice Assistant Pro",
    category: "Voice AI",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },
  {
    id: 25,
    title: "Robo-Rescue Missions™",
    description: "Fun, hands-on intro to AI concepts with creative projects.",
    audience: "Primary",
    mode: "Online",
    duration: "4 weeks",
    price: "£25",
    rating: 4.7,
    students: 300,
    level: "Beginner",
    startDate: "2025-07-19",
    features: ["What is AI?", "Train a mini model", "Build & test project", "Showcase & ethics"],
    instructor: "Rescue Robot",
    category: "Robotics",
    keywords: ["games", "robots", "ethics"],
    prerequisites: "None"
  },

  // Secondary School Courses (26-50)
  {
    id: 26,
    title: "Ultimate Academic Advantage by AI™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 890,
    level: "Intermediate",
    startDate: "2025-02-01",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Prof. James Wilson",
    category: "Academic Enhancement",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 27,
    title: "Teen Machine Learning Bootcamp™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 720,
    level: "Intermediate",
    startDate: "2025-02-08",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Dr. Teen ML Expert",
    category: "Machine Learning",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 28,
    title: "Code Your Own ChatGPT™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 650,
    level: "Intermediate",
    startDate: "2025-02-15",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "ChatGPT Creator",
    category: "Language Models",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 29,
    title: "AI Game Design Challenge™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.7,
    students: 580,
    level: "Intermediate",
    startDate: "2025-02-22",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Game AI Designer",
    category: "Game Development",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 30,
    title: "Vision Hack Lab™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 470,
    level: "Intermediate",
    startDate: "2025-03-01",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Vision Hacker",
    category: "Computer Vision",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 31,
    title: "Data Science for Teens™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 780,
    level: "Intermediate",
    startDate: "2025-03-08",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Teen Data Scientist",
    category: "Data Science",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 32,
    title: "AI & Social Good Projects™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 520,
    level: "Intermediate",
    startDate: "2025-03-15",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Social Good AI",
    category: "AI for Good",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 33,
    title: "GenAI Music Producer™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.6,
    students: 340,
    level: "Intermediate",
    startDate: "2025-03-22",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Sofia Martinez",
    category: "Creative AI",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 34,
    title: "AI Startup Simulation™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 610,
    level: "Intermediate",
    startDate: "2025-03-29",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Startup Simulator",
    category: "Entrepreneurship",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 35,
    title: "Cybersecurity AI Defender™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 450,
    level: "Intermediate",
    startDate: "2025-04-05",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Cyber Defender",
    category: "Cybersecurity",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 36,
    title: "Autonomous Drone Programming™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.7,
    students: 380,
    level: "Intermediate",
    startDate: "2025-04-12",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Drone Programmer",
    category: "Robotics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 37,
    title: "AI-powered Science Fair™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 560,
    level: "Intermediate",
    startDate: "2025-04-19",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Science Fair AI",
    category: "Science Projects",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 38,
    title: "Ethics & Bias Debugathon™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 420,
    level: "Intermediate",
    startDate: "2025-04-26",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Ethics Debugger",
    category: "AI Ethics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 39,
    title: "AI for Exam Prep™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 890,
    level: "Intermediate",
    startDate: "2025-05-03",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Exam Prep AI",
    category: "Academic Enhancement",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 40,
    title: "Sentiment Analyzer Build™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.7,
    students: 350,
    level: "Intermediate",
    startDate: "2025-05-10",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Sentiment Builder",
    category: "NLP",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 41,
    title: "Predictive Sports Analytics™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 480,
    level: "Intermediate",
    startDate: "2025-05-17",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Sports Analyst",
    category: "Sports Analytics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 42,
    title: "Smart Home Automation Coding™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.6,
    students: 320,
    level: "Intermediate",
    startDate: "2025-05-24",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Smart Home Coder",
    category: "IoT",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 43,
    title: "AR/VR with AI™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 410,
    level: "Intermediate",
    startDate: "2025-05-31",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "AR/VR AI Expert",
    category: "AR/VR",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 44,
    title: "Bioinformatics for Beginners™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.7,
    students: 280,
    level: "Intermediate",
    startDate: "2025-06-07",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Bio AI Specialist",
    category: "Bioinformatics",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 45,
    title: "Design Thinking with AI™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 520,
    level: "Intermediate",
    startDate: "2025-06-14",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Design Thinker",
    category: "Design",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 46,
    title: "Finance Forecasting Mini-Camp™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 390,
    level: "Intermediate",
    startDate: "2025-06-21",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Finance Forecaster",
    category: "FinTech",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 47,
    title: "AI Journalism Workshop™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.6,
    students: 260,
    level: "Intermediate",
    startDate: "2025-06-28",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "AI Journalist",
    category: "Media",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 48,
    title: "Sustainable Cities with AI™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.8,
    students: 440,
    level: "Intermediate",
    startDate: "2025-07-05",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Sustainable AI",
    category: "Sustainability",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 49,
    title: "AI Poetry & Language Lab™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.7,
    students: 320,
    level: "Intermediate",
    startDate: "2025-07-12",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Poetry AI Lab",
    category: "Language Arts",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },
  {
    id: 50,
    title: "Neural Network Art Studio™",
    description: "Build industry-aligned AI skills and showcase portfolio pieces.",
    audience: "Secondary",
    mode: "Online",
    duration: "6 weeks",
    price: "£39",
    rating: 4.9,
    students: 580,
    level: "Intermediate",
    startDate: "2025-07-19",
    features: ["Data & ML crash-course", "Model building hands-on", "Deployment & apps", "Ethics & career paths"],
    instructor: "Neural Artist",
    category: "Creative AI",
    keywords: ["python", "ml", "projects"],
    prerequisites: "None"
  },

  // Professional Courses (51-75)
  {
    id: 51,
    title: "Boost Productivity with Generative AI™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£79",
    rating: 4.9,
    students: 1250,
    level: "Intermediate",
    startDate: "2025-02-01",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Dr. Sarah Chen",
    category: "Productivity",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 52,
    title: "Generative AI for Software Developers™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£129",
    rating: 4.8,
    students: 980,
    level: "Advanced",
    startDate: "2025-02-08",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Alex Rodriguez",
    category: "Software Development",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 53,
    title: "Generative AI for Product Managers™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£99",
    rating: 4.7,
    students: 720,
    level: "Intermediate",
    startDate: "2025-02-15",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Product AI Expert",
    category: "Product Management",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 54,
    title: "Applied NLP in Business™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£89",
    rating: 4.8,
    students: 650,
    level: "Intermediate",
    startDate: "2025-02-22",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "NLP Business Expert",
    category: "Natural Language Processing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 55,
    title: "Computer Vision in Manufacturing™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£89",
    rating: 4.9,
    students: 540,
    level: "Intermediate",
    startDate: "2025-03-01",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Manufacturing AI",
    category: "Computer Vision",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 56,
    title: "AI for Marketing Professionals™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£69",
    rating: 4.7,
    students: 890,
    level: "Intermediate",
    startDate: "2025-03-08",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Marketing AI Pro",
    category: "Marketing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 57,
    title: "Responsible AI Governance™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£99",
    rating: 4.8,
    students: 430,
    level: "Intermediate",
    startDate: "2025-03-15",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "AI Governance Expert",
    category: "AI Governance",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 58,
    title: "Data Engineering with ML Pipelines™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£149",
    rating: 4.9,
    students: 520,
    level: "Advanced",
    startDate: "2025-03-22",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Data Engineering Expert",
    category: "Data Engineering",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 59,
    title: "Edge AI for IoT Engineers™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "7 weeks",
    price: "£119",
    rating: 4.8,
    students: 340,
    level: "Advanced",
    startDate: "2025-03-29",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Edge AI Engineer",
    category: "Edge Computing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 60,
    title: "AI-driven Cybersecurity Ops™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "7 weeks",
    price: "£129",
    rating: 4.9,
    students: 460,
    level: "Advanced",
    startDate: "2025-04-05",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Cybersecurity AI",
    category: "Cybersecurity",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 61,
    title: "Financial Modeling with ML™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£149",
    rating: 4.8,
    students: 380,
    level: "Advanced",
    startDate: "2025-04-12",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Financial ML Expert",
    category: "FinTech",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 62,
    title: "Healthcare AI Applications™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£109",
    rating: 4.9,
    students: 290,
    level: "Intermediate",
    startDate: "2025-04-19",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Healthcare AI",
    category: "Healthcare",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 63,
    title: "HR Analytics & Talent AI™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£79",
    rating: 4.7,
    students: 610,
    level: "Intermediate",
    startDate: "2025-04-26",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "HR AI Specialist",
    category: "Human Resources",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 64,
    title: "Supply Chain Optimization AI™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£99",
    rating: 4.8,
    students: 420,
    level: "Intermediate",
    startDate: "2025-05-03",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Supply Chain AI",
    category: "Supply Chain",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 65,
    title: "Retail Personalization Engines™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£79",
    rating: 4.7,
    students: 550,
    level: "Intermediate",
    startDate: "2025-05-10",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Retail AI Expert",
    category: "Retail",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 66,
    title: "Conversational AI Design Sprint™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Hybrid",
    duration: "4 weeks",
    price: "£69",
    rating: 4.8,
    students: 480,
    level: "Intermediate",
    startDate: "2025-05-17",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Conversational AI",
    category: "Conversational AI",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 67,
    title: "Recommendation Systems Workshop™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£79",
    rating: 4.9,
    students: 360,
    level: "Intermediate",
    startDate: "2025-05-24",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Recommendation Expert",
    category: "Recommendation Systems",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 68,
    title: "Cloud ML Deployment Bootcamp™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£99",
    rating: 4.8,
    students: 640,
    level: "Intermediate",
    startDate: "2025-05-31",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Cloud ML Expert",
    category: "Cloud Computing",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 69,
    title: "MLOps Essentials™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "7 weeks",
    price: "£119",
    rating: 4.9,
    students: 570,
    level: "Intermediate",
    startDate: "2025-06-07",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "MLOps Specialist",
    category: "MLOps",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 70,
    title: "AI Quality Assurance & Testing™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£79",
    rating: 4.7,
    students: 320,
    level: "Intermediate",
    startDate: "2025-06-14",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "AI QA Expert",
    category: "Quality Assurance",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 71,
    title: "Customer Insights with AI™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "5 weeks",
    price: "£79",
    rating: 4.8,
    students: 690,
    level: "Intermediate",
    startDate: "2025-06-21",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Customer AI Expert",
    category: "Customer Analytics",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 72,
    title: "Language Model Fine-tuning Lab™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "8 weeks",
    price: "£149",
    rating: 4.9,
    students: 280,
    level: "Advanced",
    startDate: "2025-06-28",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "LLM Fine-tuning Expert",
    category: "Language Models",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 73,
    title: "Autonomous Vehicles Overview™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "6 weeks",
    price: "£99",
    rating: 4.7,
    students: 190,
    level: "Intermediate",
    startDate: "2025-07-05",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Autonomous Vehicle Expert",
    category: "Autonomous Systems",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 74,
    title: "Time Series Forecasting Mastery™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Online",
    duration: "7 weeks",
    price: "£119",
    rating: 4.8,
    students: 410,
    level: "Advanced",
    startDate: "2025-07-12",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "Time Series Expert",
    category: "Forecasting",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 75,
    title: "AI Strategy for Executives™",
    description: "Apply AI to real workplace challenges for measurable impact.",
    audience: "Professional",
    mode: "Hybrid",
    duration: "4 weeks",
    price: "£199",
    rating: 4.9,
    students: 850,
    level: "Beginner",
    startDate: "2025-07-19",
    features: ["Opportunity mapping", "Tool deep-dive & demos", "Build solution prototype", "Metrics & governance"],
    instructor: "AI Strategy Expert",
    category: "Executive Strategy",
    keywords: ["llms", "deployment", "governance"],
    prerequisites: "Basic IT literacy"
  },

  // SME/Business Courses (76-100)
  {
    id: 76,
    title: "AI Opportunity Assessment™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Virtual",
    duration: "3 weeks",
    price: "£149",
    rating: 4.8,
    students: 340,
    level: "Beginner",
    startDate: "2025-02-01",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Dr. Michael Foster",
    category: "Business Assessment",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 77,
    title: "AI for Business Transformation™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Virtual",
    duration: "8 weeks",
    price: "£299",
    rating: 4.9,
    students: 280,
    level: "Intermediate",
    startDate: "2025-02-08",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Business AI Transformer",
    category: "Business Strategy",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 78,
    title: "No-Code AI Automations™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£129",
    rating: 4.7,
    students: 520,
    level: "Beginner",
    startDate: "2025-02-15",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "No-Code AI Expert",
    category: "Automation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 79,
    title: "Small Business Chatbot Builder™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "3 weeks",
    price: "£99",
    rating: 4.8,
    students: 680,
    level: "Beginner",
    startDate: "2025-02-22",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Chatbot Builder Pro",
    category: "Customer Service",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 80,
    title: "E-commerce Personalization Quick-Win™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "3 weeks",
    price: "£119",
    rating: 4.6,
    students: 390,
    level: "Beginner",
    startDate: "2025-03-01",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "E-commerce AI",
    category: "E-commerce",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 81,
    title: "AI-Enhanced Customer Support™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£109",
    rating: 4.9,
    students: 570,
    level: "Beginner",
    startDate: "2025-03-08",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Support AI Expert",
    category: "Customer Support",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 82,
    title: "Predictive Inventory for Retail™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£139",
    rating: 4.7,
    students: 260,
    level: "Beginner",
    startDate: "2025-03-15",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Inventory AI",
    category: "Inventory Management",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 83,
    title: "Fraud Detection for SMEs™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "3 weeks",
    price: "£129",
    rating: 4.8,
    students: 180,
    level: "Beginner",
    startDate: "2025-03-22",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Fraud Detection AI",
    category: "Security",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 84,
    title: "Local Marketing with AI Insights™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£99",
    rating: 4.6,
    students: 420,
    level: "Beginner",
    startDate: "2025-03-29",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Local Marketing AI",
    category: "Marketing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 85,
    title: "Workflow Automation Blueprint™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "5 weeks",
    price: "£159",
    rating: 4.9,
    students: 340,
    level: "Beginner",
    startDate: "2025-04-05",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Workflow AI Expert",
    category: "Workflow Automation",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 86,
    title: "Predictive Maintenance for SMB Manufacturing™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Hybrid",
    duration: "6 weeks",
    price: "£199",
    rating: 4.8,
    students: 150,
    level: "Intermediate",
    startDate: "2025-04-12",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Manufacturing AI",
    category: "Manufacturing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 87,
    title: "AI-Driven Sales Funnel Optimizer™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£119",
    rating: 4.7,
    students: 480,
    level: "Intermediate",
    startDate: "2025-04-19",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Sales AI Optimizer",
    category: "Sales",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 88,
    title: "HR Chatbot for Hiring™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "3 weeks",
    price: "£109",
    rating: 4.8,
    students: 290,
    level: "Beginner",
    startDate: "2025-04-26",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "HR AI Chatbot",
    category: "Human Resources",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 89,
    title: "Decision Dashboards with AutoML™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "5 weeks",
    price: "£149",
    rating: 4.9,
    students: 220,
    level: "Intermediate",
    startDate: "2025-05-03",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "AutoML Dashboard Expert",
    category: "Business Intelligence",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 90,
    title: "Generative Content for Branding™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£99",
    rating: 4.6,
    students: 380,
    level: "Intermediate",
    startDate: "2025-05-10",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Brand Content AI",
    category: "Content Marketing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 91,
    title: "AI-Powered Email Campaigns™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "3 weeks",
    price: "£89",
    rating: 4.7,
    students: 560,
    level: "Beginner",
    startDate: "2025-05-17",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Email AI Campaign",
    category: "Email Marketing",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 92,
    title: "Voice Commerce Enablement™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£129",
    rating: 4.8,
    students: 170,
    level: "Intermediate",
    startDate: "2025-05-24",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Voice Commerce AI",
    category: "Voice Commerce",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 93,
    title: "Store Traffic Analytics via Vision AI™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Hybrid",
    duration: "4 weeks",
    price: "£159",
    rating: 4.7,
    students: 130,
    level: "Intermediate",
    startDate: "2025-05-31",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Vision Analytics AI",
    category: "Retail Analytics",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 94,
    title: "Financial Risk Scoring Lite™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£139",
    rating: 4.8,
    students: 190,
    level: "Intermediate",
    startDate: "2025-06-07",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Risk Scoring AI",
    category: "Risk Management",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 95,
    title: "Sustainability Tracking AI™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£119",
    rating: 4.9,
    students: 240,
    level: "Intermediate",
    startDate: "2025-06-14",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Sustainability AI",
    category: "Sustainability",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 96,
    title: "AI ROI Measurement Clinic™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Virtual",
    duration: "3 weeks",
    price: "£149",
    rating: 4.8,
    students: 310,
    level: "Intermediate",
    startDate: "2025-06-21",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "ROI Measurement Expert",
    category: "ROI Analytics",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 97,
    title: "Personalized Training Bots for Staff™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£129",
    rating: 4.7,
    students: 160,
    level: "Intermediate",
    startDate: "2025-06-28",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Training Bot AI",
    category: "Training & Development",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 98,
    title: "Data Readiness Workshop™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Hybrid",
    duration: "3 weeks",
    price: "£119",
    rating: 4.8,
    students: 270,
    level: "Intermediate",
    startDate: "2025-07-05",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Data Readiness Expert",
    category: "Data Strategy",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 99,
    title: "AI Compliance Essentials™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Online",
    duration: "4 weeks",
    price: "£139",
    rating: 4.9,
    students: 210,
    level: "Intermediate",
    startDate: "2025-07-12",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "AI Compliance Expert",
    category: "Compliance",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  },
  {
    id: 100,
    title: "Future-proof Your Business with AI™",
    description: "Unlock immediate business value through practical AI solutions.",
    audience: "Business",
    mode: "Virtual",
    duration: "6 weeks",
    price: "£199",
    rating: 4.8,
    students: 290,
    level: "Intermediate",
    startDate: "2025-07-19",
    features: ["Identify pain points", "Quick-win prototypes", "Implementation planning", "ROI & next steps"],
    instructor: "Future AI Strategist",
    category: "Future Strategy",
    keywords: ["automation", "roi", "no-code"],
    prerequisites: "Basic IT literacy"
  }
];

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "Online": return <Monitor className="h-4 w-4" />;
    case "Virtual": return <Video className="h-4 w-4" />;
    case "Hybrid": return <BookOpen className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

const getAudienceColor = (audience: string) => {
  switch (audience) {
    case "Primary": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
    case "Secondary": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "Professional": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Business": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

export function TrainingPrograms() {
  const { selectedAudience: globalAudience, getPersonalizedContent, getPersonalizedStyles } = usePersonalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudience, setSelectedAudience] = useState(globalAudience || "all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = selectedAudience === "all" || program.audience === selectedAudience;
    const matchesMode = selectedMode === "all" || program.mode === selectedMode;
    const matchesLevel = selectedLevel === "all" || program.level === selectedLevel;
    
    return matchesSearch && matchesAudience && matchesMode && matchesLevel;
  });

  return (
    <section 
      id="training-programs" 
      className={`py-20 ${getPersonalizedStyles({
      primary: "bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10",
      secondary: "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10",
      professional: "bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-950/10 dark:to-gray-950/10",
      business: "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10",
      default: "bg-background"
    })}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">
              {getPersonalizedContent({
                primary: "🎓 Fun AI Learning Adventures",
                secondary: "🚀 AI Training Programs",
                professional: "🎯 Professional AI Certification",
                business: "💼 Enterprise AI Training Solutions",
                default: "Training Programs"
              })}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {getPersonalizedContent({
              primary: "Discover amazing AI adventures through fun games, colorful activities, and interactive learning designed just for you!",
              secondary: "Master cutting-edge AI technology with hands-on projects, career guidance, and future-ready skills development.",
              professional: "Advance your career with industry-leading AI certifications, expert insights, and practical applications.",
              business: "Transform your organization with comprehensive AI training solutions, team development, and measurable business impact.",
              default: "Discover our comprehensive AI education programs designed for every learning journey. New batches start every month with flexible learning options."
            })}
          </p>
        </div>


        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 mb-12 shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2 text-primary">
              <Filter className="h-5 w-5" />
              <span className="font-semibold">Filter Programs:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="Primary">Primary School</SelectItem>
                  <SelectItem value="Secondary">Secondary School</SelectItem>
                  <SelectItem value="Professional">Professionals</SelectItem>
                  <SelectItem value="Business">SME/Business</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* New Batches Info */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Badge variant="secondary" className="px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            New Batches every Month
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Flexible Learning Options
          </Badge>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="course-card">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getAudienceColor(program.audience)}>
                    {program.audience}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{program.price}</div>
                    <div className="text-sm text-muted-foreground">per course</div>
                  </div>
                </div>
                
                <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                  {program.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {program.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getModeIcon(program.mode)}
                    <span>{program.mode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{program.duration}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{program.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{program.students.toLocaleString()} students</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{program.level}</Badge>
                  <span className="text-muted-foreground">
                    Starts: {new Date(program.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Instructor: {program.instructor}</p>
                <div className="flex flex-wrap gap-1">
                  {program.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {program.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{program.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 btn-hero group">
                  Enroll Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No programs found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedAudience("all");
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
    </section>
  );
}