import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { usePlannerStore } from '@/features/planner/store/plannerStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(true);
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();

  if (hasSeenOnboarding) {
    return null;
  }

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

  const handleStartPlanning = () => {
    setIsOpen(false);
    setHasSeenOnboarding(true);
    trackEvent(
      {
        category: 'onboarding',
        action: 'started_planning',
      },
      {},
    );
    const { openMenuFn, openPlanner } = usePlannerStore.getState();
    openPlanner();
    openMenuFn?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleSkip();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm" className="max-w-xs">
          <div className="flex flex-col items-center px-5 pb-4 pt-6 text-center">
            <div className="mb-5 flex size-14 items-center justify-center rounded-(--shape-lg) bg-brand-primary/10 text-brand-primary dark:text-brand-accent">
              <MapPin className="size-7" aria-hidden="true" />
            </div>

            <Dialog.Title className="text-balance text-lg">Para onde você quer ir?</Dialog.Title>

            <Dialog.Description className="mt-2 max-w-65 text-pretty text-center">
              Escolha seu destino para encontrar a linha, a parada de embarque e o próximo horário.
            </Dialog.Description>
          </div>

          <div className="flex gap-2 border-t border-card-border p-3">
            <Button variant="ghost" onClick={handleSkip}>
              Ver linhas
            </Button>
            <Button className="flex-1" onClick={handleStartPlanning}>
              Planejar caminho
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
