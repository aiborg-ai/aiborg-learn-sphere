import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingTooltip, OnboardingHighlight } from '../OnboardingTooltip';

describe('OnboardingTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <OnboardingTooltip tipId="test-tip" title="Test Title" description="Test Description">
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('shows tooltip after delay', async () => {
    render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        delay={500}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    // Tooltip should not be visible initially
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();

    // Fast-forward time past the delay
    vi.advanceTimersByTime(600);

    // Wait for tooltip to appear
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not show tooltip again if showOnce is true', async () => {
    const { rerender } = render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        showOnce={true}
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    // Fast-forward time to show tooltip
    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    // Dismiss tooltip
    const dismissButton = screen.getByLabelText('Dismiss tip');
    fireEvent.click(dismissButton);

    // Wait for tooltip to be removed
    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    // Remount component
    rerender(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        showOnce={true}
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    // Fast-forward time again
    vi.advanceTimersByTime(150);

    // Tooltip should not appear again
    await waitFor(
      () => {
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('handles "Got it" button click', async () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        actionLabel="Got it"
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    // Fast-forward time to show tooltip
    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    // Click "Got it" button
    const gotItButton = screen.getByRole('button', { name: 'Got it' });
    fireEvent.click(gotItButton);

    // Verify custom event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'onboarding-tip-completed',
        detail: { tipId: 'test-tip' },
      })
    );

    // Tooltip should be dismissed
    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    dispatchEventSpy.mockRestore();
  });

  it('handles "Later" button click', async () => {
    render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    // Fast-forward time to show tooltip
    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    // Click "Later" button
    const laterButton = screen.getByRole('button', { name: 'Later' });
    fireEvent.click(laterButton);

    // Tooltip should be dismissed
    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });
  });

  it('applies correct placement classes', async () => {
    const { container } = render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        placement="top"
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    // Check for placement-related classes (bottom-full for top placement)
    const tooltipContainer = container.querySelector('.bottom-full');
    expect(tooltipContainer).toBeInTheDocument();
  });

  it('uses custom action label', async () => {
    render(
      <OnboardingTooltip
        tipId="test-tip"
        title="Test Title"
        description="Test Description"
        actionLabel="I understand"
        delay={100}
      >
        <button>Test Button</button>
      </OnboardingTooltip>
    );

    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'I understand' })).toBeInTheDocument();
  });
});

describe('OnboardingHighlight', () => {
  beforeEach(() => {
    // Create a target element for the highlight
    const targetElement = document.createElement('div');
    targetElement.setAttribute('data-testid', 'target-element');
    targetElement.classList.add('target-selector');
    document.body.appendChild(targetElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('finds and highlights target element', async () => {
    render(
      <OnboardingHighlight
        tipId="test-highlight"
        title="Highlight Title"
        description="Highlight Description"
        targetSelector=".target-selector"
        delay={100}
      />
    );

    // Wait for the element to be found and highlighted
    await waitFor(
      () => {
        const targetElement = document.querySelector('.target-selector');
        expect(targetElement?.classList.contains('onboarding-highlight')).toBe(true);
      },
      { timeout: 500 }
    );
  });

  it('dispatches completion event on button click', async () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <OnboardingHighlight
        tipId="test-highlight"
        title="Highlight Title"
        description="Highlight Description"
        targetSelector=".target-selector"
        delay={100}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText('Highlight Title')).toBeInTheDocument();
      },
      { timeout: 500 }
    );

    const gotItButton = screen.getByRole('button', { name: 'Got it' });
    fireEvent.click(gotItButton);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'onboarding-tip-completed',
        detail: { tipId: 'test-highlight' },
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('removes highlight class when dismissed', async () => {
    render(
      <OnboardingHighlight
        tipId="test-highlight"
        title="Highlight Title"
        description="Highlight Description"
        targetSelector=".target-selector"
        delay={100}
      />
    );

    await waitFor(
      () => {
        const targetElement = document.querySelector('.target-selector');
        expect(targetElement?.classList.contains('onboarding-highlight')).toBe(true);
      },
      { timeout: 500 }
    );

    const dismissButton = screen.getByLabelText('Dismiss tip');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      const targetElement = document.querySelector('.target-selector');
      expect(targetElement?.classList.contains('onboarding-highlight')).toBe(false);
    });
  });

  it('does not render if target element is not found', () => {
    render(
      <OnboardingHighlight
        tipId="test-highlight"
        title="Highlight Title"
        description="Highlight Description"
        targetSelector=".non-existent-selector"
        delay={100}
      />
    );

    // Tooltip should not be rendered
    expect(screen.queryByText('Highlight Title')).not.toBeInTheDocument();
  });
});
