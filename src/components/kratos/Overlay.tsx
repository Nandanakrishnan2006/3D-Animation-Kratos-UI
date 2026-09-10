import { useEffect, useRef, type RefObject } from "react";

import { clamp01, easeInOut, easeOut, pulse, seg } from "./progress";

type Act = {
  key: string;
  label: string;
  word: string;
  sub: string;
  window: [number, number];
  drift: number;
};

const ACT_LIST: Act[] = [
  {
    key: "technical",
    label: "01 / Technical Events",
    word: "TECHNICAL",
    sub: "Paper Wars · Circuit Sprint · Code Forge",
    window: [0.14, 0.33],
    drift: -1,
  },
  {
    key: "spark",
    label: "02 / Spark Events",
    word: "SPARK",
    sub: "Ideathon · Pitch Arena · Innovation Lab",
    window: [0.31, 0.5],
    drift: 1,
  },
  {
    key: "online",
    label: "03 / Online Events",
    word: "ONLINE",
    sub: "Remote Quiz · Digital Design · Cloud Clash",
    window: [0.46, 0.64],
    drift: -1,
  },
  {
    key: "playground",
    label: "04 / Playground Events",
    word: "PLAYGROUND",
    sub: "Esports Arena · Free Fire · Turf Tactics",
    window: [0.6, 0.77],
    drift: 1,
  },
  {
    key: "hackathon",
    label: "05 / Hackathon",
    word: "HACKATHON",
    sub: "24 Hours · Build · Break · Dominate",
    window: [0.73, 0.89],
    drift: -1,
  },
];

const NAV = [
  "Technical",
  "Spark",
  "Online",
  "Playground",
  "Hackathon",
];

export function Overlay({ progress }: { progress: RefObject<number> }) {
  const actRefs = useRef<Array<HTMLDivElement | null>>([]);
  const openRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progress.current;

      // Opening line, fades as the lion takes over
      if (openRef.current) {
        const o = 1 - easeInOut(clamp01(seg(p, 0.02, 0.12)));
        openRef.current.style.opacity = String(easeOut(clamp01(p / 0.02)) * o);
        openRef.current.style.transform = `translate3d(0, ${(1 - o) * -40}px, 0) scale(${1 + (1 - o) * 0.12})`;
      }

      // Kinetic act typography sweeping behind the 3D objects
      ACT_LIST.forEach((act, i) => {
        const el = actRefs.current[i];
        if (!el) return;
        const t = seg(p, act.window[0], act.window[1]);
        const live = t > 0.001 && t < 0.999;
        el.style.visibility = live ? "visible" : "hidden";
        if (!live) return;
        const o = pulse(t, 0.18, 0.7);
        const x = (0.5 - t) * 62 * act.drift;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${x}vw, ${(0.5 - t) * -6}vh, 0) rotate(${(0.5 - t) * 2.2 * act.drift}deg) scale(${0.88 + o * 0.16})`;
      });

      // Final hero composition
      if (heroRef.current) {
        const h = easeOut(seg(p, 0.88, 0.97));
        heroRef.current.style.opacity = String(h);
        heroRef.current.style.transform = `translate3d(0, ${(1 - h) * 48}px, 0)`;
        heroRef.current.style.visibility = h > 0.001 ? "visible" : "hidden";
      }
      if (navRef.current) {
        const n = easeOut(seg(p, 0.9, 0.99));
        navRef.current.style.opacity = String(n);
        navRef.current.style.transform = `translate3d(0, ${(1 - n) * -24}px, 0)`;
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - clamp01(p / 0.05));
      }
      if (flashRef.current) {
        // ignition flashes on each scene handoff
        const beats = [0.14, 0.31, 0.46, 0.6, 0.73, 0.87];
        let f = 0;
        for (const b of beats) f = Math.max(f, 1 - Math.min(1, Math.abs(p - b) / 0.012));
        flashRef.current.style.opacity = String(f * 0.35);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <>
      {/* kinetic type layer — sits BEHIND the 3D canvas */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <div
          ref={openRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <p className="font-display text-[11px] tracking-[0.62em] text-ember/80 uppercase">
            Sri College of Engineering presents
          </p>
          <p className="mt-6 font-heading text-[clamp(2rem,7vw,6rem)] leading-none text-gold-metal">
            THE BEAST AWAKENS
          </p>
        </div>

        {ACT_LIST.map((act, i) => (
          <div
            key={act.key}
            ref={(el) => {
              actRefs.current[i] = el;
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ visibility: "hidden", opacity: 0 }}
          >
            <span className="font-display text-[clamp(10px,1vw,13px)] uppercase tracking-[0.5em] text-ember">
              {act.label}
            </span>
            <h2 className="mt-2 whitespace-nowrap font-heading text-[clamp(4rem,17vw,17rem)] leading-[0.82] text-outline-gold">
              {act.word}
            </h2>
            <span className="mt-4 font-display text-[clamp(10px,1.1vw,15px)] uppercase tracking-[0.38em] text-bone/70">
              {act.sub}
            </span>
          </div>
        ))}
      </div>

      {/* foreground layer — hero, nav, hint (ABOVE the canvas) */}
      <div className="pointer-events-none fixed inset-0 z-30">
        <nav
          ref={navRef}
          className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-6 px-6 py-6 opacity-0 md:px-12"
        >
          <span className="font-heading text-lg tracking-[0.35em] text-gold-metal">KRATOS</span>
          <ul className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <li key={item}>
                <a
                  href="#events"
                  className="font-display text-[11px] uppercase tracking-[0.32em] text-bone/65 transition-colors hover:text-gold"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <a
              href="#login"
              className="font-display text-[11px] uppercase tracking-[0.3em] text-bone/70 transition-colors hover:text-gold"
            >
              Login
            </a>
            <a
              href="#register"
              className="btn-ember font-display text-[11px] uppercase tracking-[0.3em]"
            >
              Register
            </a>
          </div>
        </nav>

        <div
          ref={heroRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ visibility: "hidden", opacity: 0 }}
        >
          {/* lion is rendered in 3D on the left; the title sits beside it */}
          <div className="ml-[26vw] max-w-[52vw] text-left md:ml-[24vw]">
            <h1 className="font-heading text-[clamp(3.5rem,12vw,11rem)] leading-[0.85] text-gold-metal">
              KRATOS
            </h1>
            <p className="mt-2 font-heading text-[clamp(1rem,2.4vw,2.1rem)] tracking-[0.5em] text-ember">
              MMXXVI
            </p>
            <p className="mt-5 font-display text-[clamp(10px,1.1vw,14px)] uppercase tracking-[0.42em] text-bone/75">
              Where Relentless Meets Competition
            </p>
          </div>
        </div>

        <div
          ref={hintRef}
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
        >
          <span className="font-display text-[10px] uppercase tracking-[0.5em] text-bone/50">
            Scroll to begin
          </span>
          <span className="scroll-line" />
        </div>

        <div
          ref={flashRef}
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(255,180,60,0.9), rgba(224,41,15,0.25) 45%, transparent 72%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </>
  );
}
