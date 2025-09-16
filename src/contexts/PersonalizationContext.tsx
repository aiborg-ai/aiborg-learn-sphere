import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Audience = "All" | "primary" | "secondary" | "professional" | "business";

interface PersonalizationContextType {
  selectedAudience: Audience;
  setSelectedAudience: (audience: Audience) => void;
  getPersonalizedContent: <T = unknown>(content: PersonalizedContent<T>) => T;
  getPersonalizedStyles: (styles: PersonalizedStyles) => string;
}

interface PersonalizedContent<T = unknown> {
  primary?: T;
  secondary?: T;
  professional?: T;
  business?: T;
  default?: T;
}

interface PersonalizedStyles {
  primary?: string;
  secondary?: string;
  professional?: string;
  business?: string;
  default?: string;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};

interface PersonalizationProviderProps {
  children: ReactNode;
}

export const PersonalizationProvider: React.FC<PersonalizationProviderProps> = ({ children }) => {
  const [selectedAudience, setSelectedAudience] = useState<Audience>(() => {
    // Check URL hash for audience selection
    const hash = window.location.hash;
    if (hash.startsWith('#audience-')) {
      const audienceFromHash = hash.replace('#audience-', '') as Audience;
      if (['primary', 'secondary', 'professional', 'business'].includes(audienceFromHash)) {
        return audienceFromHash;
      }
    }
    // Check localStorage for previously selected audience
    const stored = localStorage.getItem('aiborg-selected-audience');
    if (stored && ['primary', 'secondary', 'professional', 'business'].includes(stored)) {
      return stored as Audience;
    }
    // Default to "All"
    return "All";
  });

  useEffect(() => {
    if (selectedAudience && selectedAudience !== "All") {
      localStorage.setItem('aiborg-selected-audience', selectedAudience);
      // Apply audience-specific body classes for global styling
      document.body.className = document.body.className.replace(/audience-\w+/g, '');
      document.body.classList.add(`audience-${selectedAudience}`);
    } else {
      localStorage.removeItem('aiborg-selected-audience');
      document.body.className = document.body.className.replace(/audience-\w+/g, '');
    }
  }, [selectedAudience]);

  // Listen for hash changes to update audience selection
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#audience-')) {
        const audienceFromHash = hash.replace('#audience-', '') as Audience;
        if (['primary', 'secondary', 'professional', 'business'].includes(audienceFromHash)) {
          setSelectedAudience(audienceFromHash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getPersonalizedContent = <T = unknown>(content: PersonalizedContent<T>): T => {
    if (!selectedAudience || selectedAudience === "All" || !content[selectedAudience]) {
      return (content.default || content) as T;
    }
    return content[selectedAudience] as T;
  };

  const getPersonalizedStyles = (styles: PersonalizedStyles) => {
    if (!selectedAudience || selectedAudience === "All" || !styles[selectedAudience]) {
      return styles.default || '';
    }
    return styles[selectedAudience];
  };

  return (
    <PersonalizationContext.Provider
      value={{
        selectedAudience,
        setSelectedAudience,
        getPersonalizedContent,
        getPersonalizedStyles,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
};

// Personalization configuration
export const AUDIENCE_CONFIG = {
  All: {
    name: "All Audiences",
    theme: "default",
  },
  primary: {
    name: "Young Learners",
    displayName: "Young Learners",
    theme: "playful",
    colors: {
      primary: "var(--primary-light)",
      accent: "var(--accent-light)",
      background: "var(--background-soft)",
    },
    language: {
      level: "simple",
      tone: "friendly", 
      vocabulary: "basic",
    },
    features: {
      gamification: true,
      parentalControls: true,
      simpleNavigation: true,
      cartoonIllustrations: true,
      progressBadges: true,
    },
  },
  secondary: {
    name: "Teenagers",
    displayName: "Teenagers",
    theme: "modern",
    colors: {
      primary: "var(--primary)",
      accent: "var(--accent)",
      background: "var(--background)",
    },
    language: {
      level: "intermediate",
      tone: "engaging",
      vocabulary: "technical",
    },
    features: {
      careerGuidance: true,
      codingChallenges: true,
      peerCollaboration: true,
      collegePreperation: true,
      discussionForums: true,
    },
  },
  professional: {
    name: "Professionals",
    displayName: "Professionals",
    theme: "clean",
    colors: {
      primary: "var(--primary-dark)",
      accent: "var(--accent-professional)",
      background: "var(--background-professional)",
    },
    language: {
      level: "advanced",
      tone: "professional",
      vocabulary: "industry",
    },
    features: {
      certifications: true,
      cpeCredits: true,
      networking: true,
      expertWebinars: true,
      portfolioBuilder: true,
      industrySpecific: true,
    },
  },
  business: {
    name: "SMEs",
    displayName: "SMEs", 
    theme: "enterprise",
    colors: {
      primary: "var(--primary-enterprise)",
      accent: "var(--accent-enterprise)",
      background: "var(--background-enterprise)",
    },
    language: {
      level: "executive",
      tone: "strategic",
      vocabulary: "business",
    },
    features: {
      analytics: true,
      teamManagement: true,
      roiCalculators: true,
      customTraining: true,
      hrIntegration: true,
      dashboard: true,
    },
  },
};