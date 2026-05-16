/**
 * Format a date string to a human-readable form.
 * @param {string} dateStr - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', { ...defaults, ...options }).format(new Date(dateStr));
};

/**
 * Format a floating-point rating to 1 decimal place.
 */
export const formatRating = (value) => {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(1);
};

/**
 * Capitalise first letter of a string.
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/**
 * Truncate a string to maxLen characters, appending '…'.
 */
export const truncate = (str, maxLen = 50) =>
  str && str.length > maxLen ? str.slice(0, maxLen) + '…' : str;

/**
 * Get the error message from an Axios error response.
 */
export const getApiError = (err) => {
  return err?.response?.data?.error || err?.message || 'An unexpected error occurred.';
};
