import { useMemo, useState } from 'react';

type VirtualRowsOptions = {
  count: number;
  rowHeight: number;
  viewportHeight: number;
  overscan?: number;
};

export function useVirtualRows({ count, rowHeight, viewportHeight, overscan = 8 }: VirtualRowsOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  const range = useMemo(() => {
    const startIndex = Math.max(Math.floor(scrollTop / rowHeight) - overscan, 0);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const endIndex = Math.min(startIndex + visibleCount, count);

    return {
      startIndex,
      endIndex,
      offsetTop: startIndex * rowHeight,
      totalHeight: count * rowHeight,
    };
  }, [count, overscan, rowHeight, scrollTop, viewportHeight]);

  return {
    ...range,
    setScrollTop,
  };
}

