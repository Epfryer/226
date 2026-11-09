import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { m as motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

const blackHold = 160;
const wipeDuration = 4660;
const fadeDuration = 180;
const entranceEase = [0.76, 0, 0.24, 1] as const;

function RouteEntranceOverlay({ pathname, onComplete }: {
  pathname: string;
  onComplete: (pathname: string) => void;
}) {
  const markRef = useRef<HTMLSpanElement>(null);
  const [target, setTarget] = useState<{ x: number; y: number; scale: number } | null>(null);

  useEffect(() => {
    // Keep the entrance bounded even if an animation is interrupted.
    const deadline = window.setTimeout(
      () => onComplete(pathname),
      blackHold + wipeDuration + fadeDuration + 300,
    );
    return () => window.clearTimeout(deadline);
  }, [pathname, onComplete]);

  useLayoutEffect(() => {
    let frame = 0;
    let attempts = 0;
    const measure = () => {
      const mark = markRef.current;
      const brand = document.querySelector<HTMLElement>("[data-intro-brand]");
      if (mark && brand) {
        const markRect = mark.getBoundingClientRect();
        const brandRect = brand.getBoundingClientRect();
        setTarget({
          x: brandRect.left + brandRect.width / 2 - window.innerWidth / 2,
          y: brandRect.top + brandRect.height / 2 - window.innerHeight / 2,
          scale: Math.max(0.42, Math.min(0.82, brandRect.width / Math.max(markRect.width, 1))),
        });
      } else if (attempts++ < 8) {
        frame = requestAnimationFrame(measure);
      } else {
        setTarget({ x: -window.innerWidth / 2 + 50, y: -window.innerHeight / 2 + 42, scale: 0.75 });
      }
    };
    frame = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <motion.div
      className="route-entrance"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: fadeDuration / 1000, delay: (blackHold + wipeDuration) / 1000, ease: "linear" }}
      onAnimationComplete={() => onComplete(pathname)}
    >
      <motion.div
        className="route-entrance-wipe"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: wipeDuration / 1000, delay: blackHold / 1000, ease: entranceEase }}
      />
      <motion.span
        ref={markRef}
        className="route-entrance-mark"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          ...(target ?? { x: 0, y: 0, scale: 1 }),
        }}
        transition={{ duration: wipeDuration / 1000, delay: blackHold / 1000, ease: entranceEase }}
        style={{ color: "#fff" }}
      >
        D.EF
      </motion.span>
    </motion.div>
  );
}

export function RouteEntrance() {
  const [location] = useLocation();
  const pathname = location.split(/[?#]/, 1)[0] || "/";
  const reducedMotion = useReducedMotion();
  const [run, setRun] = useState({ pathname, id: 0 });
  const [completedRun, setCompletedRun] = useState<number | null>(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : null,
  );
  const latestPath = useRef(pathname);
  const latestRunId = useRef(run.id);
  latestPath.current = pathname;
  latestRunId.current = run.id;

  useLayoutEffect(() => {
    if (reducedMotion) {
      setCompletedRun(run.id);
      return;
    }
    if (run.pathname !== pathname) {
      setRun((current) => ({ pathname, id: current.id + 1 }));
    }
  }, [pathname, reducedMotion, run.id, run.pathname]);

  if (reducedMotion || run.pathname !== pathname || completedRun === run.id) return null;

  return (
    <RouteEntranceOverlay
      key={run.id}
      pathname={run.pathname}
      onComplete={(finishedPath) => {
        if (latestPath.current === finishedPath && latestRunId.current === run.id) setCompletedRun(run.id);
      }}
    />
  );
}
