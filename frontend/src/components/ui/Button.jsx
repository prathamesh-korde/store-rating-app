import { Loader2 } from 'lucide-react';

/**
 * Button component with variants: primary | secondary | danger | ghost
 * Supports loading state with spinner.
 */
export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'text-sm px-3 py-1.5 min-h-[36px]' : size === 'lg' ? 'text-base px-6 py-3' : '';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
