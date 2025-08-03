import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TrainingPrograms } from "@/components/TrainingPrograms";
import { EventsSection } from "@/components/EventsSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AIChatbot } from "@/components/AIChatbot";
import { ContactSection } from "@/components/ContactSection";
import { AboutSection } from "@/components/AboutSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <AnnouncementTicker />
      <Navbar />
      <HeroSection />
      <div id="about">
        <AboutSection />
      </div>
      <div id="training-programs">
        <TrainingPrograms />
      </div>
      <div id="events">
        <EventsSection />
      </div>
      <div id="reviews">
        <ReviewsSection />
      </div>
      <div id="contact">
        <ContactSection />
      </div>
      <AIChatbot />
    </div>
  );
};

export default Index;
