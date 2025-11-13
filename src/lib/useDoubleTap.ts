import { useRef, useCallback } from 'react';

interface UseDoubleTapOptions {
  onSingleTap?: () => void;
  onDoubleTap: () => void;
  delay?: number;
}

export function useDoubleTap({ onSingleTap, onDoubleTap, delay = 300 }: UseDoubleTapOptions) {
  const lastTapTime = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      onDoubleTap();
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;

      if (onSingleTap) {
        tapTimeoutRef.current = setTimeout(() => {
          onSingleTap();
          tapTimeoutRef.current = null;
        }, delay);
      }
    }
  }, [onSingleTap, onDoubleTap, delay]);

  return handleTap;
}
