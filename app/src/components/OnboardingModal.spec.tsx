/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingModal } from './OnboardingModal';

const mockStore = {
  hasSeenOnboarding: false,
  setHasSeenOnboarding: vi.fn(),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockStore,
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
  }),
}));

describe('OnboardingModal', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockStore.hasSeenOnboarding = false;
    mockStore.setHasSeenOnboarding.mockClear();
  });

  it('abre somente quando onboarding_completed está falso', () => {
    mockStore.hasSeenOnboarding = false;
    const { rerender } = render(<OnboardingModal />);
    expect(screen.getByText('Bem-vindo ao Interno Rotas')).toBeTruthy();

    mockStore.hasSeenOnboarding = true;
    rerender(<OnboardingModal />);
    expect(screen.queryByText('Bem-vindo ao Interno Rotas')).toBeNull();
  });

  it('slide 1 descreve consulta sem cadastro', () => {
    render(<OnboardingModal />);
    expect(screen.getAllByText(/Sem cadastro obrigatório/i).length).toBeGreaterThan(0);
  });

  it('slide 2 descreve GPS colaborativo e engajamento', () => {
    render(<OnboardingModal />);
    fireEvent.click(screen.getAllByRole('button', { name: /Próximo/i })[0]);
    expect(screen.getAllByText(/GPS colaborativo/i).length).toBeGreaterThan(0);
  });

  it('slide 3 cita LGPD com link /privacidade', () => {
    render(<OnboardingModal />);
    fireEvent.click(screen.getAllByRole('button', { name: /Próximo/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Próximo/i })[0]);

    expect(screen.getByText(/LGPD/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /política de privacidade/i });
    expect(link.getAttribute('href')).toBe('/privacidade');
  });
});
