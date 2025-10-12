import { useEffect } from "react";

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    let startY = 0;
    let startX = 0;

    // Store original values to restore later
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocumentElementOverflow =
      document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width more accurately
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Store current computed padding to preserve existing layout
    const bodyComputedStyle = window.getComputedStyle(document.body);
    const currentPaddingRight =
      parseInt(bodyComputedStyle.paddingRight, 10) || 0;

    // Apply scroll prevention with proper compensation
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden"; // Also lock html element

    // Only compensate if there's actually a scrollbar
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    // Handle touch events for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as Element;
      // Allow scrolling within modal content
      if (target.closest("#mantine-injector-root")) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      // Prevent scrolling
      if (Math.abs(currentY - startY) > Math.abs(currentX - startX)) {
        e.preventDefault();
      }
    };

    // Handle wheel events for desktop
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Element;
      // Allow scrolling within modal content
      if (target.closest("#mantine-injector-root")) {
        return;
      }
      e.preventDefault();
    };

    // Handle keyboard scroll events
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollKeys = [
        " ",
        "PageUp",
        "PageDown",
        "End",
        "Home",
        "ArrowLeft",
        "ArrowUp",
        "ArrowRight",
        "ArrowDown",
      ];
      if (scrollKeys.includes(e.key)) {
        const target = e.target as Element;
        // Allow scrolling within modal content
        if (target.closest("#mantine-injector-root")) {
          return;
        }
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      // Restore original styles
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocumentElementOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;

      // Remove event listeners
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocked]);
}
