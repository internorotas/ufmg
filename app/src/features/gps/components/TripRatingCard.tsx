import { Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { rateTrip } from '@/features/gps/api/gpsClient';
import { useAnalytics } from '@/hooks/useAnalytics';

interface TripRatingCardProps {
  sessionId: string;
  linhaNome: string;
  linhaCorHex: string;
  onRated: () => void;
  onDismiss: () => void;
}

export function TripRatingCard({
  sessionId,
  linhaNome,
  linhaCorHex,
  onRated,
  onDismiss,
}: TripRatingCardProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const { trackEvent } = useAnalytics();

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || submitting) return;

    setSubmitting(true);
    try {
      await rateTrip(sessionId, {
        rating,
        comment: comment.trim() || undefined,
      });
      trackEvent({
        event: 'trip_rated',
        category: 'engagement',
        action: 'trip_rated',
        label: linhaNome,
        params: { rating, has_comment: comment.trim().length > 0 },
      });
      setSubmitted(true);
      setTimeout(onRated, 1500);
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
  }, [rating, comment, sessionId, submitting, trackEvent, linhaNome, onRated]);

  if (submitted) {
    return (
      <div className="pointer-events-none fixed inset-0 z-(--z-sheet) flex items-end justify-start pb-24 pl-3 md:items-center md:justify-center md:pb-0 md:pl-0">
        <div className="pointer-events-auto w-56 rounded-(--shape-md) border border-brand-primary/20 bg-brand-primary/5 p-4 shadow-(--elevation-2) backdrop-blur-sm md:max-w-xs md:w-full md:mx-4">
          <p className="text-center text-sm font-semibold text-brand-primary">
            Obrigado pela avaliação!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-sheet) flex items-end justify-start pb-24 pl-3 md:items-center md:justify-center md:pb-0 md:pl-0">
      <div className="pointer-events-auto w-56 rounded-(--shape-md) border border-card-border bg-card p-4 shadow-(--elevation-2) md:max-w-xs md:w-full md:mx-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: `${linhaCorHex}22`, color: linhaCorHex }}
          >
            <Star size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary">Como foi sua viagem?</p>
            <p className="truncate text-[10px] text-text-secondary">{linhaNome}</p>
          </div>
        </div>

        <div className="mb-3 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            >
              <Star
                size={24}
                className={
                  star <= (hoveredStar || rating)
                    ? 'fill-brand-primary text-brand-primary'
                    : 'text-text-tertiary'
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentário opcional..."
          maxLength={500}
          rows={2}
          className="mb-3 w-full resize-none rounded-lg border border-card-border bg-background-secondary px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        />

        {submitError && (
          <p role="alert" className="mb-2 text-[10px] text-danger-text">
            Falha ao enviar avaliação. Tente novamente.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-card-hover"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={rating === 0 || submitting}
            className="flex-1 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Avaliar'}
          </button>
        </div>
      </div>
    </div>
  );
}
