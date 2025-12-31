/**
 * Chatbot State Hook
 *
 * Manages all UI state for the chatbot component including:
 * - Open/close state
 * - Input field value
 * - Loading states
 * - UI toggles (fullscreen, WhatsApp, history)
 * - Model selection
 */

import { useState } from 'react';
import { OllamaService } from '@/services/ai/OllamaService';

export interface ChatbotUIState {
  isOpen: boolean;
  inputValue: string;
  isTyping: boolean;
  showWhatsApp: boolean;
  showHistory: boolean;
  isFullscreen: boolean;
  useOllama: boolean;
  selectedOllamaModel: string;
}

export interface ChatbotStateActions {
  setIsOpen: (value: boolean) => void;
  setInputValue: (value: string) => void;
  setIsTyping: (value: boolean) => void;
  setShowWhatsApp: (value: boolean) => void;
  setShowHistory: (value: boolean) => void;
  setIsFullscreen: (value: boolean) => void;
  setUseOllama: (value: boolean) => void;
  setSelectedOllamaModel: (value: string) => void;
  toggleOpen: () => void;
  toggleFullscreen: () => void;
  toggleHistory: () => void;
  resetInput: () => void;
}

export function useChatbotState() {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AI model configuration
  const [useOllama, setUseOllama] = useState(true);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState(OllamaService.getDefaultModel());

  // Derived state
  const state: ChatbotUIState = {
    isOpen,
    inputValue,
    isTyping,
    showWhatsApp,
    showHistory,
    isFullscreen,
    useOllama,
    selectedOllamaModel,
  };

  // Action helpers
  const actions: ChatbotStateActions = {
    setIsOpen,
    setInputValue,
    setIsTyping,
    setShowWhatsApp,
    setShowHistory,
    setIsFullscreen,
    setUseOllama,
    setSelectedOllamaModel,

    toggleOpen: () => setIsOpen(prev => !prev),
    toggleFullscreen: () => setIsFullscreen(prev => !prev),
    toggleHistory: () => setShowHistory(prev => !prev),
    resetInput: () => setInputValue(''),
  };

  return { state, actions };
}
