import { Bus, MapPin, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { LegalModalType } from '@/types/legal.types';

const SLIDE_TONES = {
  brand: 'bg-brand-primary/10 text-brand-primary',
  success: 'bg-success-bg text-success-text',
  accent: 'bg-brand-accent/15 text-brand-accent',
} as const;

const SLIDES = [
  {
    icon: Bus,
    tone: 'brand',
    title: 'Bem-vindo ao Interno Rotas',
    description:
      'Sem cadastro obrigatório: consulte linhas e paradas da UFMG rapidamente e salve favoritas quando quiser.',
  },
  {
    icon: MapPin,
    tone: 'success',
    title: 'GPS Colaborativo',
    description:
      'Ajude a comunidade com GPS colaborativo: quando você compartilha posição, mais pessoas recebem previsões melhores.',
  },
  {
    icon: Shield,
    tone: 'accent',
    title: 'Seus dados são seus',
    description: 'Seguimos a LGPD para tratamento de dados de localização e transparência de uso.',
  },
] as const;

interface OnboardingModalProps {
  onOpenLegalModal: (modalType: LegalModalType) => void;
}

export function OnboardingModal({ onOpenLegalModal }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();

  if (hasSeenOnboarding) {
    return null;
  }

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setHasSeenOnboarding(true);
    trackEvent(
      {
        category: 'onboarding',
        action: 'skipped',
      },
      {},
    );
  };

  const handleAccept = () => {
    setIsOpen(false);
    setHasSeenOnboarding(true);
    trackEvent(
      {
        category: 'onboarding',
        action: 'completed',
      },
      { slides_viewed: SLIDES.length },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleSkip();
    }
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const CurrentIcon = SLIDES[currentSlide].icon;
  const currentTone = SLIDE_TONES[SLIDES[currentSlide].tone];

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <div className="flex flex-col items-center py-6 px-4">
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center surface-card-sm ${currentTone}`}
            >
              <CurrentIcon className="h-8 w-8" />
            </div>

            <Dialog.Title className="mb-3 text-center text-xl font-semibold">
              {SLIDES[currentSlide].title}
            </Dialog.Title>

            <Dialog.Description className="text-center">
              {SLIDES[currentSlide].description}{' '}
              {currentSlide === 2 ? (
                <>
                  Leia nossa{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('privacidade')}
                    className="font-semibold underline"
                  >
                    Política de Privacidade
                  </button>
                  .
                </>
              ) : null}
            </Dialog.Description>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {SLIDES.map((slide, index) => (
              <button
                type="button"
                key={slide.title}
                className={`h-2 rounded-sm transition-colors ${
                  index === currentSlide ? 'w-6 bg-brand-primary' : 'w-2 bg-card-border'
                }`}
                aria-label={`Slide ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          <div className="flex justify-between gap-2 p-4">
            <Button variant="ghost" onClick={handleSkip}>
              {isLastSlide ? 'Agora não' : 'Pular'}
            </Button>
            <Button onClick={isLastSlide ? handleAccept : handleNext}>
              {isLastSlide ? 'Aceito' : 'Próximo'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
