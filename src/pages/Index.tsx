import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TrainingPrograms } from "@/components/TrainingPrograms";
import { AIChatbot } from "@/components/AIChatbot";
import { ContactSection } from "@/components/ContactSection";
import { AboutSection } from "@/components/AboutSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <AnnouncementTicker />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <TrainingPrograms />
      <ContactSection />
      <AIChatbot />
    </div>
  );
};

export default Index;
