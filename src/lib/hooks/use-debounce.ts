import { useEffect, useMemo, useRef } from 'react';

export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T;
  }, [delay]);
}
