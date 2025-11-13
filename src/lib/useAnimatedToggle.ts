import { useState, useCallback, useRef, useEffect } from 'react';

export function useAnimatedToggle(duration = 180) {
  const [isOpen, setIsOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setOpen = useCallback((open: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (open) {
      setShow(true);
      setIsOpen(true);
      setClosing(false);
    } else {
      setClosing(true);
      timeoutRef.current = setTimeout(() => {
        setShow(false);
        setIsOpen(false);
        setClosing(false);
        timeoutRef.current = null;
      }, duration);
    }
  }, [duration]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    show,
    closing,
    isOpen,
    setOpen,
    projectSwitcherOpen: isOpen
  };
}
