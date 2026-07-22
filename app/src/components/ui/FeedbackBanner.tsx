import { cn } from '@/lib/utils';

interface FeedbackBannerProps {
  message: string;
  type?: 'success' | 'error';
  live?: 'polite' | 'assertive';
  className?: string;
}

export function FeedbackBanner({
  message,
  type = 'error',
  live = 'polite',
  className,
}: FeedbackBannerProps) {
  return (
    <div
      role="status"
      aria-live={live}
      className={cn(
        'rounded-(--shape-sm) border px-4 py-3 text-sm',
        type === 'success'
          ? 'border-success-border bg-success-bg text-success-text'
          : 'border-danger-border bg-danger-bg text-danger-text',
        className,
      )}
    >
      {message}
    </div>
  );
}
