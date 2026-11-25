import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  widths?: number[];
  sizes?: string;
  quality?: number;
  priority?: boolean;
  rootMargin?: string;
  className?: string;
  wrapperClassName?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

const DEFAULT_WIDTHS = [240, 400, 800];

function isServerOptimizableSrc(src: string): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false;
  if (
    trimmed.startsWith('/src/assets/images/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/api/uploads/')
  ) {
    return true;
  }
  if (trimmed.startsWith('https://') && trimmed.includes('/storage/v1/object/public/product-images/')) {
    return true;
  }
  return false;
}

function buildOptimizedUrl(src: string, width: number, fmt: 'avif' | 'webp', quality?: number): string {
  const params = new URLSearchParams({
    src,
    w: String(width),
    fmt
  });
  if (quality) {
    params.set('q', String(quality));
  }
  return `/api/image?${params.toString()}`;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  widths = DEFAULT_WIDTHS,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px',
  quality,
  priority = false,
  rootMargin = '300px 0px',
  className = '',
  wrapperClassName = 'w-full h-full block',
  referrerPolicy = 'no-referrer'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isInView, setIsInView] = useState<boolean>(() => {
    if (priority) return true;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return true;
    return false;
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(priority);
  const [fallbackToRaw, setFallbackToRaw] = useState<boolean>(false);

  // Reset fallback state when src changes
  useEffect(() => {
    setFallbackToRaw(false);
    if (priority || src.startsWith('data:')) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src, priority]);

  // IntersectionObserver-based lazy loading
  useEffect(() => {
    if (priority || isInView) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setIsInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, isInView, rootMargin]);

  const canOptimize = useMemo(
    () => !fallbackToRaw && isServerOptimizableSrc(src),
    [src, fallbackToRaw]
  );

  const avifSrcSet = useMemo(() => {
    if (!canOptimize || !isInView) return undefined;
    return widths.map(w => `${buildOptimizedUrl(src, w, 'avif', quality)} ${w}w`).join(', ');
  }, [canOptimize, isInView, src, widths, quality]);

  const webpSrcSet = useMemo(() => {
    if (!canOptimize || !isInView) return undefined;
    return widths.map(w => `${buildOptimizedUrl(src, w, 'webp', quality)} ${w}w`).join(', ');
  }, [canOptimize, isInView, src, widths, quality]);

  const defaultWidth = useMemo(() => {
    if (width && width > 0) return width;
    return widths[Math.min(1, widths.length - 1)] || 400;
  }, [width, widths]);

  const fallbackImgSrc = useMemo(() => {
    if (!isInView) return undefined;
    if (canOptimize) {
      return buildOptimizedUrl(src, defaultWidth, 'webp', quality);
    }
    return src;
  }, [isInView, canOptimize, src, defaultWidth, quality]);

  // Ensure cached images that already finished loading never stay stuck at opacity-0
  useEffect(() => {
    if (!isInView) return;
    const imgEl = imgRef.current;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      setIsLoaded(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setIsLoaded(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isInView, fallbackImgSrc, fallbackToRaw]);

  const handleError = () => {
    if (canOptimize) {
      setFallbackToRaw(true);
    } else {
      setIsLoaded(true);
    }
  };

  return (
    <div ref={containerRef} className={wrapperClassName}>
      {isInView ? (
        <picture className="block w-full h-full">
          {avifSrcSet && (
            <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
          )}
          {webpSrcSet && (
            <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
          )}
          <img
            ref={imgRef}
            src={fallbackImgSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : undefined}
            referrerPolicy={referrerPolicy}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={`${className} transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      ) : (
        <div
          className="w-full h-full min-h-[1px] bg-stone-100"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
