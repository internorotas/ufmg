import { type RefObject, useEffect, useRef } from 'react';

const DISMISS_THRESHOLD_PX = 100;
const DISMISS_VELOCITY_PX_MS = 0.5;

/**
 * Arrastar para baixo a partir do handle de um bottom sheet fecha o sheet —
 * o handle visual (barra arredondada no topo) já promete esse gesto em apps
 * de referência (Google Maps, iOS sheets); sem isso a affordance é quebrada.
 */
export function useSwipeToDismissSheet(
  sheetRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handle = handleRef.current;
    const sheet = sheetRef.current;
    if (!handle || !sheet) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let startY = 0;
    let startTime = 0;
    let dragging = false;

    const setTransform = (deltaY: number, withTransition: boolean) => {
      sheet.style.transition =
        withTransition && !prefersReducedMotion ? 'transform 200ms ease-out' : '';
      sheet.style.transform = deltaY > 0 ? `translateY(${deltaY}px)` : '';
    };

    const handleTouchStart = (event: TouchEvent) => {
      dragging = true;
      startY = event.touches[0].clientY;
      startTime = event.timeStamp;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!dragging) return;
      const deltaY = event.touches[0].clientY - startY;
      if (deltaY <= 0) return;
      event.preventDefault();
      setTransform(deltaY, false);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      const deltaY = event.changedTouches[0].clientY - startY;
      const elapsed = Math.max(1, event.timeStamp - startTime);
      const velocity = deltaY / elapsed;

      if (deltaY > DISMISS_THRESHOLD_PX || velocity > DISMISS_VELOCITY_PX_MS) {
        onCloseRef.current();
        return;
      }
      setTransform(0, true);
    };

    handle.addEventListener('touchstart', handleTouchStart, { passive: true });
    handle.addEventListener('touchmove', handleTouchMove, { passive: false });
    handle.addEventListener('touchend', handleTouchEnd);
    handle.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      handle.removeEventListener('touchstart', handleTouchStart);
      handle.removeEventListener('touchmove', handleTouchMove);
      handle.removeEventListener('touchend', handleTouchEnd);
      handle.removeEventListener('touchcancel', handleTouchEnd);
      sheet.style.transition = '';
      sheet.style.transform = '';
    };
  }, [sheetRef, handleRef]);
}
