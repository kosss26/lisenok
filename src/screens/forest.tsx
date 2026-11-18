import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FOREST } from "../content/forest";
import { BackButton, Fox, ParentsButton, Pic, Scene, StarCount } from "../components/kit";
import { say, sfx } from "../game/audio";
import { nextStopIndex, starsIn, stopOpen, update, useProgress } from "../game/progress";

export function Forest() {
  const p = useProgress();
  const navigate = useNavigate();
  const next = nextStopIndex(p);
  const allDone = next >= FOREST.length;
  const celebrate = allDone && !p.forestCelebrated;
  const [shake, setShake] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (celebrate) {
        void sfx("fanfare");
        void say(["forest-done"]);
      } else if (!allDone) void say(["forest-next"]);
    }, 450);
    return () => window.clearTimeout(t);
    // only when the screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the fox walks the path: most of the way from the last solved stop to the next one
  const foxAt = FOREST[Math.min(next, FOREST.length - 1)];
  const from = next > 0 ? FOREST[next - 1] : { x: 50, y: 96 };
  const foxLeft = from.x + (foxAt.x - from.x) * 0.62;
  const foxTop = from.y + (foxAt.y - from.y) * 0.62 + 3;

  return (
    <Scene
      bg="bg-forest"
      className="forest-screen"
      boxed={
        <>
          {FOREST.map((stop, i) => {
            const open = stopOpen(p, i);
            const done = Boolean(p.done[stop.id]);
            return (
              <button
                key={stop.id}
                type="button"
                data-stop={stop.id}
                className={`stop ${done ? "is-done" : ""} ${i === next ? "is-next" : ""} ${open ? "" : "is-locked"} ${shake === stop.id ? "is-shaking" : ""}`}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                aria-label={`${stop.name}${done ? ", звезда получена" : open ? "" : ", пока закрыто"}`}
                onClick={() => {
                  if (!open) {
                    void sfx("tap");
                    setShake(stop.id);
                    window.setTimeout(() => setShake(null), 600);
                    void say(["stop-locked"]);
                    return;
                  }
                  void sfx("step");
                  void navigate({ to: "/forest/$stopId", params: { stopId: stop.id } });
                }}
              >
                <span className="stop-glow" aria-hidden />
                <Pic name={stop.resident} className="stop-pic" />
                {done && <Pic name="star" className="stop-star" />}
                <span className="stop-num" aria-hidden>
                  {i + 1}
                </span>
              </button>
            );
          })}
          {!allDone && (
            <span
              key={foxAt.id}
              className={`forest-fox-wrap ${foxLeft > foxAt.x ? "is-flipped" : ""}`}
              style={{ left: `${foxLeft}%`, top: `${foxTop}%` }}
            >
              <Fox pose="walk" className="forest-fox" />
            </span>
          )}
        </>
      }
    >
      <div className="top-bar">
        <BackButton to="/map" label="На карту" />
        <StarCount n={starsIn(p)} total={FOREST.length} />
        <ParentsButton />
      </div>
      {celebrate && (
        <div className="celebrate" role="dialog" aria-label="Лес пройден">
          <div className="confetti" aria-hidden>
            {Array.from({ length: 18 }, (_, i) => (
              <Pic key={i} name="star" className={`confetti-star c${i % 6}`} />
            ))}
          </div>
          <Pic name="star-face" className="celebrate-star" />
          <Fox pose="cheer" className="celebrate-fox" />
          <h2>Все звёзды леса собраны!</h2>
          <p>Скоро лисёнок отправится к морю.</p>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              void sfx("tap");
              update((s) => ({ ...s, forestCelebrated: true }));
            }}
          >
            Ура!
          </button>
        </div>
      )}
    </Scene>
  );
}
