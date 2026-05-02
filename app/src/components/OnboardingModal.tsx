import { Bus, MapPin, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore } from '@/stores/authStore';

const SLIDES = [
  {
    icon: Bus,
    title: 'Bem-vindo ao Interno Rotas',
    description:
      'Seu guia de transporte universitário UFMG. Veja horários em tempo real e salve suas linhas favoritas.',
  },
  {
    icon: MapPin,
    title: 'GPS Colaborativo',
    description:
      'Ajude a comunidade! Compartilhe a localização do ônibus para ajudar outros alunos a saberem quando ele chega.',
  },
  {
    icon: Shield,
    title: 'Seus dados são seus',
    description:
      'Compartilhamos localização apenas para melhorar o serviço. Você pode excluir seus dados a qualquer momento.',
  },
] as const;

export function OnboardingModal() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const { hasSeenOnboarding, setHasSeenOnboarding } = useAuthStore();
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <div className="flex flex-col items-center py-6 px-4">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CurrentIcon className="h-8 w-8 text-primary" />
            </div>

            <Dialog.Title className="mb-3 text-center text-xl font-semibold">
              {SLIDES[currentSlide].title}
            </Dialog.Title>

            <Dialog.Description className="text-center">
              {SLIDES[currentSlide].description}
            </Dialog.Description>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {SLIDES.map((slide, index) => (
              <button
                type="button"
                key={slide.title}
                className={`h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
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
