import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePageTurnOptions {
  totalPages: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  isZoomed: boolean;
}

interface CornerDragState {
  isDragging: boolean;
  startX: number;
  currentX: number;
  progress: number;
  corner: 'left' | 'right' | null;
}

export function usePageTurn({
  totalPages,
  initialPage = 0,
  onPageChange,
  isZoomed,
}: UsePageTurnOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [cornerDrag, setCornerDrag] = useState<CornerDragState>({
    isDragging: false,
    startX: 0,
    currentX: 0,
    progress: 0,
    corner: null,
  });
  
  const animationRef = useRef<number | null>(null);

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(0, Math.min(totalPages - 1, page));
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
        onPageChange?.(newPage);
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      } else if (e.key === '+' || e.key === '=') {
        // Handled by zoom controls
      } else if (e.key === '-' || e.key === '_') {
        // Handled by zoom controls
      } else if (e.key === '0') {
        // Handled by zoom controls
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  // Handle tap-to-flip zones
  const handlePageClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent, containerWidth: number) => {
      if (isZoomed) return; // Don't flip when zoomed

      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      if (!clientX) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      const relativeX = x / containerWidth;

      // Right 60% goes forward, left 40% goes back
      if (relativeX > 0.4) {
        nextPage();
      } else {
        prevPage();
      }
    },
    [isZoomed, nextPage, prevPage]
  );

  // Corner drag handlers
  const handleCornerDragStart = useCallback(
    (e: React.PointerEvent, corner: 'left' | 'right') => {
      if (isZoomed) return;

      e.stopPropagation();
      setCornerDrag({
        isDragging: true,
        startX: e.clientX,
        currentX: e.clientX,
        progress: 0,
        corner,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isZoomed]
  );

  const handleCornerDragMove = useCallback(
    (e: React.PointerEvent, containerWidth: number) => {
      if (!cornerDrag.isDragging) return;

      const deltaX = e.clientX - cornerDrag.startX;
      const progress = Math.abs(deltaX) / containerWidth;

      setCornerDrag((prev) => ({
        ...prev,
        currentX: e.clientX,
        progress: Math.min(progress, 1),
      }));
    },
    [cornerDrag]
  );

  const handleCornerDragEnd = useCallback(
    (e: React.PointerEvent, containerWidth: number) => {
      if (!cornerDrag.isDragging) return;

      e.currentTarget.releasePointerCapture(e.pointerId);

      const threshold = 0.25;
      const shouldFlip = cornerDrag.progress > threshold;

      if (shouldFlip) {
        // Animate to completion
        const startProgress = cornerDrag.progress;
        const startTime = performance.now();
        const duration = 300 * (1 - startProgress);

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

          setCornerDrag((prev) => ({
            ...prev,
            progress: startProgress + (1 - startProgress) * easedProgress,
          }));

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Complete the flip
            if (cornerDrag.corner === 'right') {
              nextPage();
            } else {
              prevPage();
            }
            setCornerDrag({
              isDragging: false,
              startX: 0,
              currentX: 0,
              progress: 0,
              corner: null,
            });
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Snap back
        const startProgress = cornerDrag.progress;
        const startTime = performance.now();
        const duration = 200;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 2); // ease-out quad

          setCornerDrag((prev) => ({
            ...prev,
            progress: startProgress * (1 - easedProgress),
          }));

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setCornerDrag({
              isDragging: false,
              startX: 0,
              currentX: 0,
              progress: 0,
              corner: null,
            });
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [cornerDrag, nextPage, prevPage]
  );

  return {
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    handlePageClick,
    cornerDrag,
    handleCornerDragStart,
    handleCornerDragMove,
    handleCornerDragEnd,
  };
}
