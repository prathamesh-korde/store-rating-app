import { useState, useEffect } from 'react';

/**
 * Debounce a rapidly-changing value.
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in ms (default 300)
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
