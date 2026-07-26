"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { ListingImage } from "@/components/listings/listing-image";
import { sanitizeListingImages } from "@/lib/media/listing-images";

const SWIPE_THRESHOLD_PX = 48;

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const safeImages = sanitizeListingImages(images);
  const hasPhotos = safeImages.length > 0;
  const count = safeImages.length;
  const currentIndex = count ? Math.min(active, count - 1) : 0;
  const current = hasPhotos ? safeImages[currentIndex]! : "";

  const goTo = useCallback(
    (index: number) => {
      if (!count) return;
      setActive(((index % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const swipeHandlers = useSwipeHandlers(goPrev, goNext);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  useEffect(() => {
    if (count <= 1 && !fullscreen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, count, goPrev, goNext]);

  if (!hasPhotos) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
        <ListingImage src="" alt={title} fill className="object-cover" sizes="50vw" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative aspect-[4/3] touch-pan-y overflow-hidden rounded-lg bg-sand select-none"
          {...swipeHandlers}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-zoom-in"
            onClick={() => setFullscreen(true)}
            aria-label="Ouvrir la photo en plein écran"
          >
            <ListingImage
              key={`${currentIndex}-${current}`}
              src={current}
              alt={`${title} — photo ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={currentIndex === 0}
            />
          </button>

          {count > 1 && (
            <>
              <NavArrow direction="prev" onClick={goPrev} className="left-2" />
              <NavArrow direction="next" onClick={goNext} className="right-2" />
              <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded bg-charcoal/70 px-2.5 py-1 text-xs text-ivory">
                {currentIndex + 1} / {count}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/65 text-ivory backdrop-blur-sm transition hover:bg-charcoal/80"
            aria-label="Plein écran"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {safeImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                  i === currentIndex
                    ? "border-deep-green"
                    : "border-charcoal/10 hover:border-deep-green/40"
                }`}
                aria-label={`Voir photo ${i + 1}`}
                aria-current={i === currentIndex}
              >
                <ListingImage src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <FullscreenLightbox
          title={title}
          images={safeImages}
          index={currentIndex}
          onClose={() => setFullscreen(false)}
          onPrev={goPrev}
          onNext={goNext}
          onGoTo={goTo}
        />
      )}
    </>
  );
}

function NavArrow({
  direction,
  onClick,
  className = "",
  large = false,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
  large?: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-charcoal/65 text-ivory backdrop-blur-sm transition hover:bg-charcoal/85 ${
        large ? "h-12 w-12" : "h-10 w-10 opacity-90 md:opacity-0 md:group-hover:opacity-100"
      } ${className}`}
      aria-label={direction === "prev" ? "Photo précédente" : "Photo suivante"}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} />
    </button>
  );
}

function FullscreenLightbox({
  title,
  images,
  index,
  onClose,
  onPrev,
  onNext,
  onGoTo,
}: {
  title: string;
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
}) {
  const src = images[index] ?? "";
  const count = images.length;
  const swipeHandlers = useSwipeHandlers(onPrev, onNext);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galerie plein écran — ${title}`}
      className="fixed inset-0 z-[2000] flex flex-col bg-charcoal/95 text-ivory"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-sm text-ivory/80">
          {title}
          {count > 1 && (
            <span className="ml-2 text-ivory/55">
              {index + 1} / {count}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory/10 hover:bg-ivory/20"
          aria-label="Fermer le plein écran"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 touch-pan-y select-none" {...swipeHandlers}>
        <div className="absolute inset-0">
          <ListingImage
            key={`fs-${index}-${src}`}
            src={src}
            alt={`${title} — photo ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {count > 1 && (
          <>
            <NavArrow direction="prev" onClick={onPrev} className="left-3" large />
            <NavArrow direction="next" onClick={onNext} className="right-3" large />
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((thumb, i) => (
            <button
              key={`fs-thumb-${thumb}-${i}`}
              type="button"
              onClick={() => onGoTo(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border-2 ${
                i === index ? "border-ivory" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <ListingImage src={thumb} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Handlers swipe horizontal (mobile + pointeur). */
function useSwipeHandlers(onPrev: () => void, onNext: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const swiped = useRef(false);

  return {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      startX.current = event.clientX;
      startY.current = event.clientY;
      swiped.current = false;
    },
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (startX.current == null || startY.current == null) return;
      const dx = event.clientX - startX.current;
      const dy = event.clientY - startY.current;
      startX.current = null;
      startY.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
      swiped.current = true;
      if (dx > 0) onPrev();
      else onNext();
    },
    onPointerCancel: () => {
      startX.current = null;
      startY.current = null;
    },
    onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      // Empêche l'ouverture plein écran juste après un swipe.
      if (!swiped.current) return;
      event.preventDefault();
      event.stopPropagation();
      swiped.current = false;
    },
  };
}
