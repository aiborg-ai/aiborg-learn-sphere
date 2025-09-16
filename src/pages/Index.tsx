import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TrainingPrograms } from "@/components/TrainingPrograms";
import { EventsSection } from "@/components/EventsSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AIChatbot } from "@/components/AIChatbot";
import { ContactSection } from "@/components/ContactSection";
import { AboutSection } from "@/components/AboutSection";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash in the URL and scroll to that section
    if (location.hash) {
      const elementId = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);
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
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;
