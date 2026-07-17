/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingModal } from './OnboardingModal';

const mockStore = {
  hasSeenOnboarding: false,
  setHasSeenOnboarding: vi.fn(),
};

vi.mock('@/stores/onboardingStore', () => ({
  useOnboardingStore: () => mockStore,
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
  }),
}));

const openPlanner = vi.fn();
const openMenuFn = vi.fn();

vi.mock('@/features/planner/store/plannerStore', () => ({
  usePlannerStore: {
    getState: () => ({ openPlanner, openMenuFn }),
  },
}));

describe('OnboardingModal', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockStore.hasSeenOnboarding = false;
    mockStore.setHasSeenOnboarding.mockClear();
    openPlanner.mockClear();
    openMenuFn.mockClear();
  });

  it('abre somente quando onboarding_completed está falso', () => {
    mockStore.hasSeenOnboarding = false;
    const { rerender } = render(<OnboardingModal />);
    expect(screen.getByText('Para onde você quer ir?')).toBeTruthy();

    mockStore.hasSeenOnboarding = true;
    rerender(<OnboardingModal />);
    expect(screen.queryByText('Para onde você quer ir?')).toBeNull();
  });

  it('orienta a pessoa para o planejamento por destino', () => {
    render(<OnboardingModal />);
    expect(screen.getByText(/escolha seu destino/i)).toBeTruthy();
  });

  it('abre o planejador ao iniciar', () => {
    render(<OnboardingModal />);
    fireEvent.click(screen.getByRole('button', { name: /planejar caminho/i }));

    expect(openPlanner).toHaveBeenCalledOnce();
    expect(openMenuFn).toHaveBeenCalledOnce();
  });
});
