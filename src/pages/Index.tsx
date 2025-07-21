import { HeroSection } from "@/components/HeroSection";
import { TrainingPrograms } from "@/components/TrainingPrograms";
import { AIChatbot } from "@/components/AIChatbot";
import { ContactSection } from "@/components/ContactSection";
import { AboutSection } from "@/components/AboutSection";
import { LogoProcessor } from "@/components/LogoProcessor";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="py-8 bg-muted/50">
        <LogoProcessor />
      </div>
      <AboutSection />
      <TrainingPrograms />
      <ContactSection />
      <AIChatbot />
    </div>
  );
};

export default Index;
