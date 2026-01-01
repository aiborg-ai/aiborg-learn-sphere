import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingProgress, OnboardingProgressCompact } from '../OnboardingProgress';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

// Mock the OnboardingContext
vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboardingContext: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  LayoutDashboard: () => <div data-testid="layout-dashboard-icon">LayoutDashboard</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
}));

describe('OnboardingProgress', () => {
  const mockProgress = {
    id: 'progress-1',
    user_id: 'user-1',
    completed_tips: ['tip-1', 'tip-2'],
    has_completed_profile: false,
    has_enrolled_in_course: false,
    has_attended_event: false,
    has_completed_assessment: true,
    has_explored_dashboard: true,
    has_used_ai_chat: false,
    has_created_content: false,
    onboarding_completed: false,
    onboarding_skipped: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    completed_at: null,
  };

  const mockSkipOnboarding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress widget with correct completion percentage', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    render(<OnboardingProgress />);

    // Check if title is rendered
    expect(screen.getByText('Getting Started')).toBeInTheDocument();

    // Check if completion percentage is calculated correctly
    // 2 out of 6 milestones completed = 33%
    expect(screen.getByText('33% Complete')).toBeInTheDocument();
  });

  it('renders all milestone items', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    render(<OnboardingProgress />);

    // Check for milestone labels
    expect(screen.getByText('Explore Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Enroll in a Course')).toBeInTheDocument();
    expect(screen.getByText('Attend an Event')).toBeInTheDocument();
    expect(screen.getByText('Complete Assessment')).toBeInTheDocument();
    expect(screen.getByText('Use AI Chat')).toBeInTheDocument();
    expect(screen.getByText('Complete Profile')).toBeInTheDocument();
  });

  it('shows completed milestones with check icon', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgress />);

    // Check for completed milestones (has_explored_dashboard and has_completed_assessment are true)
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons).toHaveLength(2); // 2 completed milestones
  });

  it('calls skipOnboarding when skip button is clicked', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    render(<OnboardingProgress />);

    const skipButton = screen.getByText('Skip for now');
    fireEvent.click(skipButton);

    expect(mockSkipOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not render when onboarding is completed', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: { ...mockProgress, onboarding_completed: true },
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgress />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when onboarding is skipped', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: { ...mockProgress, onboarding_skipped: true },
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgress />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when loading', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: null,
      loading: true,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgress />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when progress is null', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: null,
      loading: false,
      error: null,
      skipOnboarding: mockSkipOnboarding,
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgress />);

    expect(container.firstChild).toBeNull();
  });
});

describe('OnboardingProgressCompact', () => {
  const mockProgress = {
    id: 'progress-1',
    user_id: 'user-1',
    completed_tips: ['tip-1', 'tip-2'],
    has_completed_profile: false,
    has_enrolled_in_course: false,
    has_attended_event: false,
    has_completed_assessment: true,
    has_explored_dashboard: true,
    has_used_ai_chat: false,
    has_created_content: false,
    onboarding_completed: false,
    onboarding_skipped: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    completed_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compact progress widget', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: vi.fn(),
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    render(<OnboardingProgressCompact />);

    // Check if compact version renders with percentage
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('shows correct completion text', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: mockProgress,
      loading: false,
      error: null,
      skipOnboarding: vi.fn(),
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    render(<OnboardingProgressCompact />);

    // 2 out of 6 milestones completed
    expect(screen.getByText('2 of 6 completed')).toBeInTheDocument();
  });

  it('does not render when onboarding is completed', () => {
    vi.mocked(useOnboardingContext).mockReturnValue({
      progress: { ...mockProgress, onboarding_completed: true },
      loading: false,
      error: null,
      skipOnboarding: vi.fn(),
      isTipCompleted: vi.fn(),
      markTipCompleted: vi.fn(),
      markMilestone: vi.fn(),
      resetOnboarding: vi.fn(),
      shouldShowTip: vi.fn(),
      tips: [],
      getTipById: vi.fn(),
    });

    const { container } = render(<OnboardingProgressCompact />);

    expect(container.firstChild).toBeNull();
  });
});
