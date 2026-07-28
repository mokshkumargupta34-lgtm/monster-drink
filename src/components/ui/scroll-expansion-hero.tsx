import type { ReactNode } from 'react';

/**
 * Media that grows from a small card to fill the screen while the title splits
 * apart around it, driven by scroll.
 *
 * Adapted from the standalone "scroll expansion hero". That version could not
 * be dropped into this page at all: it captured `wheel` and `touchmove` with
 * `preventDefault`, and pinned the document with `window.scrollTo(0, 0)` on
 * every scroll event until its animation finished. Anywhere but the very top of
 * a page that would fight the reader for control of scrolling, and here it
 * would have broken the pinning that pages 1-3 depend on.
 *
 * So the scroll handling is gone entirely. Progress arrives as the CSS variable
 * `--expand` (0..1), set on an ancestor by whatever owns the pin — see
 * LightningSplit's hold phase. Everything below is plain CSS reading that
 * variable through calc(), which means this component renders once and then
 * animates on the compositor: no state, no effects, no listeners.
 *
 * next/image and framer-motion are also gone: this is Vite, and every animated
 * value here is a calc() away from the variable.
 */

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  /** Punch the title through whatever is behind it instead of sitting on top. */
  textBlend?: boolean;
  children?: ReactNode;
}

/**
 * Card size at --expand 0, and the size it reaches at 1. The original grew by a
 * fixed pixel amount and then clamped with min(), which meant the card stopped
 * growing about three quarters of the way through the scroll. Interpolating to
 * viewport units instead lands it exactly on the cap at the end, so the whole
 * scroll does something, at any window size.
 */
const BASE_W = 300;
const BASE_H = 400;
const FULL_W = '95vw';
const FULL_H = '85vh';
/** How far the two halves of the title slide apart, in vw. */
const TITLE_TRAVEL_VW = 30;

export default function ScrollExpandMedia({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) {
  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  // `--e` is the local alias, defaulted so the component still renders sensibly
  // if nothing is driving it (a narrow viewport, say, where the wipe is off).
  const e = 'var(--expand, 0)';

  return (
    <section
      id="scroll-expand-hero"
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* Backdrop — fades out as the media takes over. */}
      <div
        className="absolute inset-0"
        style={{ opacity: `calc(1 - ${e} * 0.85)` }}
      >
        <img
          src={bgImageSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full select-none object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Title, in two halves that part around the growing media. */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center ${
          textBlend ? 'mix-blend-difference' : ''
        }`}
      >
        <h2
          className="font-display text-4xl font-black uppercase tracking-tight text-white md:text-6xl lg:text-7xl"
          style={{ transform: `translateX(calc(${e} * -${TITLE_TRAVEL_VW}vw))` }}
        >
          {firstWord}
        </h2>
        <h2
          className="font-display text-4xl font-black uppercase tracking-tight text-emerald-400 md:text-6xl lg:text-7xl"
          style={{ transform: `translateX(calc(${e} * ${TITLE_TRAVEL_VW}vw))` }}
        >
          {restOfTitle}
        </h2>
      </div>

      {/* The media card, sized straight from the variable. */}
      <div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)]"
        style={{
          width: `max(${BASE_W}px, calc(${BASE_W}px + ${e} * (${FULL_W} - ${BASE_W}px)))`,
          height: `max(${BASE_H}px, calc(${BASE_H}px + ${e} * (${FULL_H} - ${BASE_H}px)))`,
        }}
      >
        {mediaType === 'video' ? (
          <video
            src={mediaSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={mediaSrc}
            alt={title || ''}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        {/* Scrim over the media, lifting as it grows. */}
        <div
          className="pointer-events-none absolute inset-0 bg-black/50"
          style={{ opacity: `calc(0.7 - ${e} * 0.7)` }}
        />
      </div>

      {/* Captions, fading out once the media is doing the talking. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex flex-col items-center gap-1 text-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-300"
        style={{ opacity: `calc(1 - ${e} * 2)` }}
      >
        {date && <p>{date}</p>}
        {scrollToExpand && <p className="text-emerald-400">{scrollToExpand}</p>}
      </div>

      {children}
    </section>
  );
}
