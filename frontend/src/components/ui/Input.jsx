import { forwardRef } from 'react';

/**
 * Input — icon renders in a separate box OUTSIDE / beside the input field.
 * This ensures zero overlap between icon and placeholder/text.
 */
export const Input = forwardRef(function Input(
  { label, error, id, required, className = '', type = 'text', icon: Icon, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={`input-group ${Icon ? 'has-icon' : ''}`}>
        {Icon && (
          <span className="input-icon-box" aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`form-input ${Icon ? 'input-with-icon' : ''} ${error ? 'error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Select component with label and error.
 */
export const Select = forwardRef(function Select(
  { label, error, id, required, className = '', children, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`form-input ${error ? 'error' : ''} ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Textarea component with label and error.
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, id, required, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`form-input resize-none ${error ? 'error' : ''} ${className}`}
        rows={3}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
