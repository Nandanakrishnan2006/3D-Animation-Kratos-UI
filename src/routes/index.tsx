import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { Overlay } from "@/components/kratos/Overlay";
import { Scene3D } from "@/components/kratos/Scene3D";
import { useScrollProgress } from "@/components/kratos/useScrollProgress";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "KRATOS MMXXVI — Where Relentless Meets Competition" },
      {
        name: "description",
        content:
          "KRATOS MMXXVI college symposium: technical, spark, online, playground events and a 24-hour hackathon. Enter the cinematic arena.",
      },
      { property: "og:title", content: "KRATOS MMXXVI — Where Relentless Meets Competition" },
      {
        property: "og:description",
        content:
          "A cinematic 3D symposium experience. Technical, Spark, Online, Playground events and the KRATOS Hackathon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KratosIntro,
});

function KratosIntro() {
  const { target, value } = useScrollProgress();
  const progress = useRef(0);

  useEffect(() => {
    document.body.classList.add("kratos-stage");
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-6 * dt);
      value.current += (target.current - value.current) * k;
      progress.current = value.current;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove("kratos-stage");
    };
  }, [target, value]);

  return (
    <main className="relative bg-void">
      {/* atmospheric backdrop */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, oklch(0.2 0.06 32) 0%, oklch(0.11 0.03 30) 38%, oklch(0.07 0.012 30) 72%, #000 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            "radial-gradient(110% 80% at 50% 50%, transparent 42%, rgba(0,0,0,0.62) 88%, #000 100%)",
        }}
      />

      <Overlay progress={progress} />

      <div className="pointer-events-none fixed inset-0 z-20">
        <Scene3D progress={progress} />
      </div>

      {/* scroll runway that scrubs the cinematic timeline */}
      <div className="h-[760vh]" aria-hidden="true" />

      <section id="events" className="sr-only">
        <h2>KRATOS MMXXVI event categories</h2>
        <ul>
          <li>Technical Events</li>
          <li>Spark Events</li>
          <li>Online Events</li>
          <li>Playground Events</li>
          <li>Hackathon</li>
        </ul>
      </section>
    </main>
  );
}
