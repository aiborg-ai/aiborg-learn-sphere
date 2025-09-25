import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
      // Wait for page to fully render before scrolling
      const scrollToElement = () => {
        const element = document.getElementById(elementId);
        if (element) {
          const yOffset = -80; // Account for fixed navbar height
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      };

      // Try immediately first
      scrollToElement();
      // Then try again after a delay to ensure content is loaded
      setTimeout(scrollToElement, 500);
    } else {
      // Scroll to top if no hash
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);
  return (
    <div className="min-h-screen">
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
