/**
 * @file packages/media-ui-react/src/index.ts
 * @description Headless UI Hooks and Prop-Getters pattern for Media UI components.
 * FATAL ERROR CHECK: NO CSS, NO STYLING, NO @media-sdk/core IMPORTS.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

// Utility helper for merging user props with hook prop-getters
export function mergeProps<T extends Record<string, any>>(
  defaultProps: T,
  userProps?: Partial<T>
): T {
  if (!userProps) return defaultProps;

  const result: Record<string, any> = { ...defaultProps, ...userProps };

  // Handle merging event handlers (e.g. onClick, onKeyDown)
  Object.keys(userProps).forEach((key) => {
    if (key.startsWith('on') && typeof userProps[key] === 'function' && typeof defaultProps[key] === 'function') {
      const defFn = defaultProps[key];
      const usrFn = userProps[key];
      result[key] = (...args: any[]) => {
        defFn?.(...args);
        usrFn?.(...args);
      };
    }
  });

  return result as T;
}

// ==========================================
// 1. USE GRID (Infinite Scroll Grid)
// ==========================================

export interface UseGridOptions {
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  threshold?: number; // 0 to 1
}

export interface UseGridReturn {
  getContainerProps: <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => P;
  getItemProps: <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P) => P;
  getSentinelProps: <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => P & { ref: React.RefCallback<HTMLElement> };
}

export function useGrid(options: UseGridOptions = {}): UseGridReturn {
  const { fetchNextPage, hasNextPage = false, isLoading = false, threshold = 0.5 } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRefCallback = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      if (node && hasNextPage && fetchNextPage) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isLoading) {
              fetchNextPage();
            }
          },
          { threshold }
        );
        observerRef.current.observe(node);
      }
    },
    [fetchNextPage, hasNextPage, isLoading, threshold]
  );

  const getContainerProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> = {
        role: 'grid',
        'aria-busy': isLoading,
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [isLoading]
  );

  const getItemProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> & { 'data-index'?: number } = {
        role: 'gridcell',
        'data-index': index,
        tabIndex: 0,
      };
      return mergeProps(defaultProps as P, userProps);
    },
    []
  );

  const getSentinelProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => {
      const defaultProps = {
        'aria-hidden': 'true',
        ref: sentinelRefCallback,
      };
      return mergeProps(defaultProps as any, userProps);
    },
    [sentinelRefCallback]
  );

  return {
    getContainerProps,
    getItemProps,
    getSentinelProps,
  };
}

// ==========================================
// 2. USE LIGHTBOX (Dialog Modal & Keyboard Nav)
// ==========================================

export interface UseLightboxOptions {
  totalItems: number;
  initialIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onIndexChange?: (index: number) => void;
}

export interface UseLightboxReturn {
  isOpen: boolean;
  activeIndex: number;
  open: (index?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setActiveIndex: (index: number) => void;
  getOverlayProps: <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => P;
  getContentProps: <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => P;
  getCloseButtonProps: <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P) => P;
  getNextButtonProps: <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P) => P;
  getPrevButtonProps: <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P) => P;
  getItemProps: <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P) => P;
}

export function useLightbox(options: UseLightboxOptions): UseLightboxReturn {
  const { totalItems, initialIndex = 0, isOpen: controlledIsOpen, onClose, onIndexChange } = options;

  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndexState] = useState<number>(initialIndex);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setActiveIndex = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < totalItems) {
        setActiveIndexState(newIndex);
        onIndexChange?.(newIndex);
      }
    },
    [totalItems, onIndexChange]
  );

  const open = useCallback(
    (index?: number) => {
      if (index !== undefined) {
        setActiveIndexState(index);
        onIndexChange?.(index);
      }
      setInternalIsOpen(true);
    },
    [onIndexChange]
  );

  const close = useCallback(() => {
    setInternalIsOpen(false);
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (activeIndex < totalItems - 1) {
      setActiveIndex(activeIndex + 1);
    }
  }, [activeIndex, totalItems, setActiveIndex]);

  const prev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  }, [activeIndex, setActiveIndex]);

  // Keyboard navigation & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, next, prev]);

  const getOverlayProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> = {
        role: 'presentation',
        onClick: (e: React.MouseEvent) => {
          if (e.target === e.currentTarget) {
            close();
          }
        },
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [close]
  );

  const getContentProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> = {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': `Media preview ${activeIndex + 1} of ${totalItems}`,
        tabIndex: -1,
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [activeIndex, totalItems]
  );

  const getCloseButtonProps = useCallback(
    <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P): P => {
      const defaultProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        type: 'button',
        'aria-label': 'Close lightbox',
        onClick: () => close(),
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [close]
  );

  const getNextButtonProps = useCallback(
    <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P): P => {
      const defaultProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        type: 'button',
        'aria-label': 'Next slide',
        disabled: activeIndex >= totalItems - 1,
        onClick: () => next(),
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [activeIndex, totalItems, next]
  );

  const getPrevButtonProps = useCallback(
    <P extends React.ButtonHTMLAttributes<HTMLButtonElement>>(userProps?: P): P => {
      const defaultProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        type: 'button',
        'aria-label': 'Previous slide',
        disabled: activeIndex <= 0,
        onClick: () => prev(),
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [activeIndex, prev]
  );

  const getItemProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> = {
        role: 'option',
        'aria-selected': index === activeIndex,
        onClick: () => open(index),
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [activeIndex, open]
  );

  return {
    isOpen,
    activeIndex,
    open,
    close,
    next,
    prev,
    setActiveIndex,
    getOverlayProps,
    getContentProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPrevButtonProps,
    getItemProps,
  };
}

// ==========================================
// 3. USE REEL SWIPER (Vertical Snap Paging)
// ==========================================

export interface UseReelSwiperOptions {
  itemCount: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  loop?: boolean;
}

export interface UseReelSwiperReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
  getContainerProps: <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P) => P;
  getSlideProps: <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P) => P;
}

export function useReelSwiper(options: UseReelSwiperOptions): UseReelSwiperReturn {
  const { itemCount, initialIndex = 0, onIndexChange, loop = false } = options;
  const [activeIndex, setActiveIndexState] = useState<number>(initialIndex);

  const setActiveIndex = useCallback(
    (index: number) => {
      let target = index;
      if (loop) {
        if (target < 0) target = itemCount - 1;
        if (target >= itemCount) target = 0;
      } else {
        target = Math.max(0, Math.min(itemCount - 1, target));
      }
      setActiveIndexState(target);
      onIndexChange?.(target);
    },
    [itemCount, loop, onIndexChange]
  );

  const next = useCallback(() => {
    setActiveIndex(activeIndex + 1);
  }, [activeIndex, setActiveIndex]);

  const prev = useCallback(() => {
    setActiveIndex(activeIndex - 1);
  }, [activeIndex, setActiveIndex]);

  // Keyboard vertical navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    },
    [next, prev]
  );

  // Mouse wheel vertical navigation (throttled)
  const lastWheelTime = useRef<number>(0);
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime.current < 400) return;

      if (e.deltaY > 30) {
        lastWheelTime.current = now;
        next();
      } else if (e.deltaY < -30) {
        lastWheelTime.current = now;
        prev();
      }
    },
    [next, prev]
  );

  const getContainerProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(userProps?: P): P => {
      const defaultProps: React.HTMLAttributes<HTMLElement> = {
        role: 'region',
        'aria-label': 'Reel vertical swiper',
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        onWheel: handleWheel,
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [handleKeyDown, handleWheel]
  );

  const getSlideProps = useCallback(
    <P extends React.HTMLAttributes<HTMLElement>>(index: number, userProps?: P): P => {
      const isActive = index === activeIndex;
      const defaultProps: React.HTMLAttributes<HTMLElement> & { 'data-active'?: boolean } = {
        role: 'group',
        'aria-roledescription': 'slide',
        'aria-label': `Slide ${index + 1} of ${itemCount}`,
        'aria-hidden': !isActive,
        'data-active': isActive,
      };
      return mergeProps(defaultProps as P, userProps);
    },
    [activeIndex, itemCount]
  );

  return {
    activeIndex,
    setActiveIndex,
    next,
    prev,
    getContainerProps,
    getSlideProps,
  };
}
