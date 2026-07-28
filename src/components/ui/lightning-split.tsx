import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Scroll-driven electric wipe between two full-screen sections.
 *
 * Adapted from the hover-driven "lightning split" slider. Three deliberate
 * departures from that original:
 *   - it is driven by scroll, not by a hovered left/right half, so `progress`
 *     comes from where the incoming section's leading edge sits in the viewport;
 *   - nothing is animated through React state. The original called setState
 *     twice per frame, which would re-render this page's shader, five wordmark
 *     layers and five can layers every frame; here the RAF loop writes
 *     clip-path and the polyline points straight to the DOM, the way the rest
 *     of this project drives scroll animation;
 *   - the arc is not spring-animated. A spring made the arc lag the clip edge,
 *     and for a wipe the two have to be the same line to the pixel.
 *
 * Structure: `above` and `below` are BOTH pinned with CSS `sticky` for `pinVh`
 * of scroll, stacked, while a diagonal bolt sweeps across and clips `below` in
 * from the right. Both halves holding still is what makes it read as a split
 * rather than a slide. Net document height is unchanged, so nothing downstream
 * of this shifts.
 *
 * Both sections must be exactly one viewport tall — they are pinned inside
 * one-viewport stages, so anything longer would have its tail cut off.
 */

/**
 * Default pinned length of the wipe, in viewport heights. Exported because
 * `below` is pulled up to the START of the pin, so anything navigating to it has
 * to scroll this much further to clear the sweep and actually show it.
 */
export const LIGHTNING_SPLIT_PIN_VH = 100;

export const LIGHTNING_SPLIT_CONFIG = {
  /** polyline resolution; also the number of clip-path vertices */
  segments: 48,
  /** multi-frequency wave, in the original's proportions */
  amps: [0.4, -0.8, 0.6],
  freqs: [0.7, 2.7, 3.9],
  speeds: [-1.32, 0.42, 0.95],
  shimmer: { speed: 4.2, freq: 8.5, amp: 0.25 },
  /** jag amplitude, as a percentage of viewport width */
  wavePct: 1.5,
  /** how far the bolt's foot trails its head, in percent — the original's lean */
  leanPct: 28,
  /** the bolt starts this far past the right edge and ends this far past the left */
  overshootPct: 30,
  /**
   * Half-width of the strip the plasma is clipped to, in percent. The shader
   * draws a straight bolt down the middle of its canvas, which does not follow
   * the jag — unclipped it reads as a second, separate bolt. Confining it to a
   * strip that tracks the jag turns it back into one glowing edge.
   */
  glowHalfPct: 3.5,
  /** clamp on RAF delta, so a backgrounded tab cannot jump the wave */
  timeClampSec: 0.05,
  /** emerald rather than the original's sky blue, to match this site's storm */
  strokes: {
    halo: { width: 9, color: 'rgba(16,185,129,0.30)' },
    outer: { width: 3, color: 'rgba(52,211,153,0.70)' },
    mid: { width: 2.2, color: 'rgba(16,185,129,0.55)' },
    core: { width: 1.6, color: '#f2fffa', opacity: 1 },
  },
  glowBlur: 1.4,
  /** fraction of the wipe spent fading the seam in, and out again */
  seamFade: 0.1,
} as const;

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

// Simplex-noise plasma, unchanged from the source component: a bright bolt
// through the middle of the canvas, tapering toward the left and right edges.
const FRAGMENT_SHADER = `
  precision highp float;
  uniform float iTime;
  uniform vec2 iResolution;

  vec3 random3(vec3 c) {
      float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
      vec3 r;
      r.z = fract(512.0*j);
      j *= .125;
      r.x = fract(512.0*j);
      j *= .125;
      r.y = fract(512.0*j);
      return r-0.5;
  }

  const float F3 =  0.3333333;
  const float G3 =  0.1666667;

  float simplex3d(vec3 p) {
       vec3 s = floor(p + dot(p, vec3(F3)));
       vec3 x = p - s + dot(s, vec3(G3));
       vec3 e = step(vec3(0.0), x - x.yzx);
       vec3 i1 = e*(1.0 - e.zxy);
       vec3 i2 = 1.0 - e.zxy*(1.0 - e);
       vec3 x1 = x - i1 + G3;
       vec3 x2 = x - i2 + 2.0*G3;
       vec3 x3 = x - 1.0 + 3.0*G3;
       vec4 w, d;
       w.x = dot(x, x);
       w.y = dot(x1, x1);
       w.z = dot(x2, x2);
       w.w = dot(x3, x3);
       w = max(0.6 - w, 0.0);
       d.x = dot(random3(s), x);
       d.y = dot(random3(s + i1), x1);
       d.z = dot(random3(s + i2), x2);
       d.w = dot(random3(s + 1.0), x3);
       w *= w;
       w *= w;
       d *= w;
       return dot(d, vec4(52.0));
  }

  float noise(vec3 m) {
      return   0.5333333*simplex3d(m)
              +0.2666667*simplex3d(2.0*m)
              +0.1333333*simplex3d(4.0*m)
              +0.0666667*simplex3d(8.0*m);
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec4 fragColor;
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2. -1.;
    vec2 p = fragCoord.xy/iResolution.x;
    vec3 p3 = vec3(p, iTime*0.25);
    float intensity = noise(vec3(p3*12.0+12.0));
    // x and y swapped against the original: this bolt runs down the canvas,
    // not across it, because the split is left/right.
    float t = clamp((uv.y * -uv.y * 0.16) + 0.15, 0., 1.);
    float y = abs(intensity * -t + uv.x);
    float g = pow(y, 0.14);
    vec3 col = vec3(2.0, 2.1, 2.3);
    col = col * -g + col;
    col = col * col;
    col = col * col;
    fragColor.rgb = col;
    fragColor.w = dot(col, vec3(0.299, 0.587, 0.114));
    gl_FragColor = fragColor;
  }
`;

/**
 * The plasma band that rides the seam. `paused` matters: this page already runs
 * a full-viewport shader for the chamber mist, so a second context must not
 * render outside the brief window where the wipe is on screen.
 */
function ShaderCanvas({ paused, className = '' }: { paused: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) return; // no WebGL: the SVG strokes still draw the seam

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('lightning-split shader:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('lightning-split link:', gl.getProgramInfoLog(program));
      return;
    }

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const timeLoc = gl.getUniformLocation(program, 'iTime');
    const resLoc = gl.getUniformLocation(program, 'iResolution');
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    let raf = 0;
    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      if (pausedRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.enableVertexAttribArray(posLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLoc, time * 0.001);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} pointer-events-none bg-transparent`}
      style={{ display: 'block' }}
    />
  );
}

interface LightningSplitProps {
  /** Held still and wiped away. Must be exactly one viewport tall. */
  above: ReactNode;
  /** Revealed over `above` by the bolt. Must be exactly one viewport tall. */
  below: ReactNode;
  /** Viewport-heights of pinned scroll the wipe occupies. */
  pinVh?: number;
  /**
   * Below this width the wipe is skipped and both sections render in normal
   * flow. `above` is only guaranteed to be exactly one viewport tall from `lg`
   * up — on narrow screens the chamber grows past it, and pinning a taller
   * section inside a one-viewport stage would cut its bottom off.
   */
  minWidth?: number;
  /**
   * Opaque ground painted under `below` for the length of the wipe. Required
   * because a translucent incoming section would let `above` show through it.
   */
  belowBackdropClassName?: string;
}

export default function LightningSplit({
  above,
  below,
  pinVh = LIGHTNING_SPLIT_PIN_VH,
  minWidth = 1024,
  belowBackdropClassName = 'bg-black',
}: LightningSplitProps) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGPolylineElement | null)[]>([]);

  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return (
      window.matchMedia(`(min-width: ${minWidth}px)`).matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  });
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  // Gate on width, and on the user's motion preference.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(wide.matches && !calm.matches);
    sync();
    wide.addEventListener('change', sync);
    calm.addEventListener('change', sync);
    return () => {
      wide.removeEventListener('change', sync);
      calm.removeEventListener('change', sync);
    };
  }, [minWidth]);

  useEffect(() => {
    if (!enabled) return;
    const C = LIGHTNING_SPLIT_CONFIG;
    // Small slack so the bolt is live a touch before and after the sweep.
    const SLACK = 4;

    let raf = 0;
    let time = 0;
    let last = performance.now();

    /**
     * Sweep progress, 0..1, read off the runway — which is never transformed, so
     * this cannot feed back into itself the way measuring the held layer did.
     */
    const readProgress = () => {
      const runway = runwayRef.current;
      if (!runway) return null;
      const span = (pinVh / 100) * (window.innerHeight || 800);
      if (span <= 0) return null;
      return -runway.getBoundingClientRect().top / span;
    };

    /** Is the sweep close enough to running to be worth drawing? */
    const inZone = () => {
      const p = readProgress();
      return p !== null && p > -SLACK / 100 && p < 1 + SLACK / 100;
    };

    const clear = () => {
      if (clipRef.current) clipRef.current.style.clipPath = '';
      if (glowRef.current) glowRef.current.style.clipPath = '';
      if (seamRef.current) seamRef.current.style.opacity = '0';
      if (runningRef.current) {
        runningRef.current = false;
        setRunning(false);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(C.timeClampSec, (now - last) / 1000);
      last = now;
      time += dt;

      const raw = readProgress();
      if (raw === null) {
        raf = 0;
        return;
      }

      if (raw <= -SLACK / 100 || raw >= 1 + SLACK / 100) {
        clear();
        raf = 0;
        return; // a scroll event will restart us
      }

      if (!runningRef.current) {
        runningRef.current = true;
        setRunning(true); // un-pauses the shader
      }

      const progress = Math.min(1, Math.max(0, raw));

      // The bolt sweeps right to left. Its head leads and its foot trails by
      // leanPct, giving the near-vertical diagonal of the reference.
      const sweep = (1 - progress) * (100 + 2 * C.overshootPct) - C.overshootPct;
      const head = sweep + C.leanPct / 2;
      const foot = sweep - C.leanPct / 2;

      // Sampled head to foot. y is a percentage of height, x a percentage of
      // width, so the jag holds its proportions at any viewport size.
      const pts: string[] = [];
      const clip: string[] = [];
      const stripL: string[] = [];
      const stripR: string[] = [];
      for (let i = 0; i <= C.segments; i++) {
        const t = i / C.segments;
        let off = 0;
        for (let k = 0; k < C.amps.length; k++) {
          off += C.amps[k] * Math.sin(2 * Math.PI * (C.freqs[k] * t + C.speeds[k] * time) + k * 1.3);
        }
        off +=
          C.shimmer.amp * Math.sin(2 * Math.PI * (C.shimmer.freq * t + C.shimmer.speed * time));
        const x = head * (1 - t) + foot * t + off * C.wavePct;
        const y = (t * 100).toFixed(3);
        pts.push(`${x.toFixed(3)},${y}`);
        clip.push(`${x.toFixed(3)}% ${y}%`);
        stripL.push(`${(x - C.glowHalfPct).toFixed(3)}% ${y}%`);
        stripR.push(`${(x + C.glowHalfPct).toFixed(3)}% ${y}%`);
      }

      const points = pts.join(' ');
      for (const line of lineRefs.current) line?.setAttribute('points', points);
      // `below` keeps everything to the RIGHT of the bolt: down the jag, then
      // back up the right edge.
      if (clipRef.current) {
        clipRef.current.style.clipPath = `polygon(${clip.join(', ')}, 100% 100%, 100% 0%)`;
      }
      // Strip for the plasma: down the left offset, back up the right one.
      if (glowRef.current) {
        glowRef.current.style.clipPath = `polygon(${stripL.join(', ')}, ${stripR
          .reverse()
          .join(', ')})`;
      }

      // Ramp the bolt in and out so it never pops on or off.
      if (seamRef.current) {
        const f = C.seamFade;
        const ramp = Math.min(1, Math.min(progress, 1 - progress) / f);
        seamRef.current.style.opacity = Math.max(0, ramp).toFixed(3);
      }

      raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      if (!raf && inZone()) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      clear();
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <>
        {above}
        {below}
      </>
    );
  }

  const C = LIGHTNING_SPLIT_CONFIG;

  return (
    <>
      {/* Runway: one viewport for `above` to be read, plus the pinned wipe. */}
      <div ref={runwayRef} className="relative z-10" style={{ height: `${100 + pinVh}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0">{above}</div>
        </div>
      </div>

      {/* `below`, pulled up by exactly the pin so its top edge crosses the
          viewport while `above` is held — that edge is the seam. Painted over
          `above`, and the net margin keeps the document height unchanged. */}
      {/* pointer-events-none on the wrapper, restored on the clipped layer
          below. This box overlaps `above` by a whole viewport at a higher
          z-index, and an element hit-tests across its entire box whether or not
          it paints anything — so left alone it silently swallows every click
          meant for `above`. Re-enabling on the clipped child means `below` is
          clickable exactly where it is visible, and nowhere else. */}
      <div
        className="pointer-events-none relative z-20"
        style={{
          // Pulled up so `below` is already in position when the pin starts, and
          // given an explicit height so its sticky child has exactly the pin's
          // worth of range — the same shape as `above`'s runway above. An
          // equivalent-looking padding-bottom does NOT work here: the sticky
          // range came out as zero and `below` scrolled straight through.
          // Together these leave the document height unchanged.
          marginTop: `-${100 + pinVh}vh`,
          height: `${100 + pinVh}vh`,
        }}
      >
        {/* Held by CSS `sticky`, never by a JS transform. A transform written
            from a scroll handler lands a frame behind the compositor's scroll
            offset, which reads as the whole page bobbing up and down for the
            length of the wipe; sticky is handled on the compositor and holds
            exactly. This is why `above` is pinned the same way. */}
        <div className="sticky top-0 h-screen">
          {/* The backdrop is the component's, not the incoming section's.
              Sections here are semi-transparent by design because they normally
              sit on the page's own black. Stacked over `above` that translucency
              lets it bleed through below the cut, so the wiping layer has to
              bring its own opaque ground. */}
          <div
            ref={clipRef}
            className={`pointer-events-auto h-full ${belowBackdropClassName}`}
          >
            {below}
          </div>

        {/* Seam overlay. A sibling of the clipped content, not a child, so the
            glow is free to spill above the cut. */}
        <div
          ref={seamRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-screen select-none"
          style={{ opacity: 0 }}
        >
          <div
            ref={glowRef}
            className="absolute inset-0 mix-blend-screen"
            style={{ opacity: 0.4, filter: 'blur(7px)' }}
          >
            <ShaderCanvas paused={!running} className="h-full w-full" />
          </div>

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="lightning-split-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={C.glowBlur} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* widest halo first, brightest core last */}
            <polyline
              ref={(el) => {
                lineRefs.current[3] = el;
              }}
              fill="none"
              stroke={C.strokes.halo.color}
              strokeWidth={C.strokes.halo.width}
              vectorEffect="non-scaling-stroke"
              filter="url(#lightning-split-glow)"
            />
            <polyline
              ref={(el) => {
                lineRefs.current[0] = el;
              }}
              fill="none"
              stroke={C.strokes.outer.color}
              strokeWidth={C.strokes.outer.width}
              vectorEffect="non-scaling-stroke"
              filter="url(#lightning-split-glow)"
            />
            <polyline
              ref={(el) => {
                lineRefs.current[1] = el;
              }}
              fill="none"
              stroke={C.strokes.mid.color}
              strokeWidth={C.strokes.mid.width}
              vectorEffect="non-scaling-stroke"
              filter="url(#lightning-split-glow)"
            />
            <polyline
              ref={(el) => {
                lineRefs.current[2] = el;
              }}
              fill="none"
              stroke={C.strokes.core.color}
              strokeOpacity={C.strokes.core.opacity}
              strokeWidth={C.strokes.core.width}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          </div>
        </div>
      </div>
    </>
  );
}
