import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Audience = "primary" | "secondary" | "professional" | "business" | null;

interface PersonalizationContextType {
  selectedAudience: Audience;
  setSelectedAudience: (audience: Audience) => void;
  getPersonalizedContent: (content: PersonalizedContent) => any;
  getPersonalizedStyles: (styles: PersonalizedStyles) => string;
}

interface PersonalizedContent {
  primary?: any;
  secondary?: any;
  professional?: any;
  business?: any;
  default?: any;
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
    // Persist audience selection in localStorage
    const saved = localStorage.getItem('aiborg-selected-audience');
    return saved ? (saved as Audience) : null;
  });

  useEffect(() => {
    if (selectedAudience) {
      localStorage.setItem('aiborg-selected-audience', selectedAudience);
      // Apply audience-specific body classes for global styling
      document.body.className = document.body.className.replace(/audience-\w+/g, '');
      document.body.classList.add(`audience-${selectedAudience}`);
    } else {
      localStorage.removeItem('aiborg-selected-audience');
      document.body.className = document.body.className.replace(/audience-\w+/g, '');
    }
  }, [selectedAudience]);

  const getPersonalizedContent = (content: PersonalizedContent) => {
    if (!selectedAudience || !content[selectedAudience]) {
      return content.default || content;
    }
    return content[selectedAudience];
  };

  const getPersonalizedStyles = (styles: PersonalizedStyles) => {
    if (!selectedAudience || !styles[selectedAudience]) {
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
  primary: {
    name: "Primary School",
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
    name: "Secondary School",
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
    name: "Professional",
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
    name: "Business",
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