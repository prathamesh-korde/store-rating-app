import { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating component.
 * Props:
 *   value: number (1-5) — current selected value
 *   interactive: boolean — enables click/hover interaction
 *   onChange: (value) => void
 *   size: number (icon size in px)
 *   className: string
 */
export function StarRating({ value = 0, interactive = false, onChange, size = 20, className = '' }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? `Rating: ${value} out of 5 stars` : `${value} out of 5 stars`}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        // Determine fill: when hovering, only fill up to hovered star
        // When not hovering, fill up to selected value
        const filled = hovered > 0 ? star <= hovered : star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            className={`transition-transform ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default pointer-events-none'} disabled:cursor-default`}
            aria-label={interactive ? `Rate ${star} star${star !== 1 ? 's' : ''}` : undefined}
          >
            <Star
              size={size}
              className={`transition-colors duration-100 ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-200 text-slate-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Static star display with numeric rating.
 */
export function RatingDisplay({ value, className = '' }) {
  const numeric = value ? Number(value).toFixed(1) : null;
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <StarRating value={Math.round(value || 0)} size={16} />
      {numeric !== null && (
        <span className="text-sm font-semibold text-slate-700">{numeric}</span>
      )}
    </div>
  );
}
