import { type ReactNode, useState } from 'react';

/**
 * StoryContainer — provides a bounded area with open/close state
 * for modal/overlay stories so the Ladle sidebar remains navigable.
 *
 * Uses CSS transform to create a new containing block for `fixed` positioned
 * descendants (like Dialog.Backdrop), keeping them inside the container
 * instead of covering the full viewport.
 */
export const StoryContainer = ({
  children,
  defaultOpen = true,
}: {
  children: (isOpen: boolean, setOpen: (v: boolean) => void) => ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        overflow: 'hidden',
        transform: 'translate(0)',
        willChange: 'transform',
      }}
    >
      <div style={{ padding: '16px' }}>
        {!isOpen && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'var(--color-background, #fff)',
              color: 'var(--color-text-primary, #111827)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Abrir novamente
          </button>
        )}
      </div>
      {children(isOpen, setOpen)}
    </div>
  );
};
