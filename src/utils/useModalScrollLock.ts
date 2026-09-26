import React, { useEffect, useRef } from 'react';

/**
 * Robust scroll lock and scroll isolation for modals:
 * 1. Locks document.body and document.documentElement when modal is open.
 * 2. Saves exact scroll position (e.g. scrollY = 640px) and restores it on close.
 * 3. Prevents background layout shift by accounting for scrollbar width.
 * 4. Isolates touch, wheel, and trackpad scrolling so ONLY the modal's scroll container moves.
 * 5. Prevents keyboard scroll leaking (Arrow keys, Space, PageUp/Down, Home, End) to background.
 * 6. Handles Escape key to close modal.
 */
export function useModalScrollLock(
  isActive: boolean,
  scrollContainerRef?: React.RefObject<HTMLElement | null>,
  onClose?: () => void
) {
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return;

    // 1. Record current scroll position before locking
    const currentScrollY =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    scrollYRef.current = currentScrollY;

    // Snapshot original inline styles to restore cleanly
    const originalBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    const originalHtmlStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    };

    // Calculate scrollbar width to prevent desktop layout shifts
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // 2. Lock document root and body
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    document.body.style.position = 'fixed';
    document.body.style.top = `-${currentScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 3. Touch event listener to lock background touch gestures while allowing internal scrolling
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as Node | null;
      const container = scrollContainerRef?.current;

      if (container && target && container.contains(target)) {
        // Inside dedicated PDF scroll container -> allow touch swipe to scroll PDF
        return;
      }

      // Outside the scroll container (e.g. backdrop, header, footer) -> lock
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // 4. Wheel event listener to lock background wheel/trackpad scrolling
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Node | null;
      const container = scrollContainerRef?.current;

      if (container && target && container.contains(target)) {
        // Inside PDF container -> let container consume the scroll
        return;
      }

      // Outside PDF container -> lock
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // 5. Keyboard navigation isolation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (!scrollKeys.includes(e.key)) return;

      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const container = scrollContainerRef?.current;
      if (container) {
        e.preventDefault();
        const clientHeight = container.clientHeight;
        const pageStep = Math.max(100, Math.floor(clientHeight * 0.85));

        switch (e.key) {
          case 'ArrowDown':
            container.scrollBy({ top: 90, behavior: 'smooth' });
            break;
          case 'ArrowUp':
            container.scrollBy({ top: -90, behavior: 'smooth' });
            break;
          case 'PageDown':
            container.scrollBy({ top: pageStep, behavior: 'smooth' });
            break;
          case 'PageUp':
            container.scrollBy({ top: -pageStep, behavior: 'smooth' });
            break;
          case ' ':
            if (e.shiftKey) {
              container.scrollBy({ top: -pageStep, behavior: 'smooth' });
            } else {
              container.scrollBy({ top: pageStep, behavior: 'smooth' });
            }
            break;
          case 'Home':
            container.scrollTo({ top: 0, behavior: 'smooth' });
            break;
          case 'End':
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            break;
        }
      } else {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    // Register active listeners
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    // 6. Cleanup on close or unmount
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);

      // Restore body styles
      document.body.style.position = originalBodyStyles.position;
      document.body.style.top = originalBodyStyles.top;
      document.body.style.left = originalBodyStyles.left;
      document.body.style.right = originalBodyStyles.right;
      document.body.style.width = originalBodyStyles.width;
      document.body.style.overflow = originalBodyStyles.overflow;
      document.body.style.paddingRight = originalBodyStyles.paddingRight;

      // Restore documentElement styles
      document.documentElement.style.overflow = originalHtmlStyles.overflow;
      document.documentElement.style.overscrollBehavior = originalHtmlStyles.overscrollBehavior;

      // Restore scroll position instantly with zero animation jump
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, scrollYRef.current);
      document.documentElement.style.scrollBehavior = originalHtmlStyles.scrollBehavior;
    };
  }, [isActive, scrollContainerRef, onClose]);
}
