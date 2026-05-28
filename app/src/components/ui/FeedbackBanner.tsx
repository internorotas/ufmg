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
        'rounded-xl border px-4 py-3 text-sm',
        type === 'success'
          ? 'border-success-border bg-success-bg text-success-text'
          : 'border-warning-border bg-warning-bg text-warning-text',
        className,
      )}
    >
      {message}
    </div>
  );
}
