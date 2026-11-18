import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FOREST } from "../content/forest";
import { BackButton, Fox, ParentsButton, Pic, Scene, StarCount } from "../components/kit";
import { say, sfx } from "../game/audio";
import { nextStopIndex, starsIn, stopOpen, update, useProgress } from "../game/progress";

type Pt = { x: number; y: number };
/** Where the fox stood when the forest was last shown (this launch) — it walks on from there. */
let lastFox: Pt | null = null;
const ENTRANCE: Pt = { x: 50, y: 99 };
const reduced = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The fox waits on the path most of the way from the last solved stop to the next one. */
function foxSpot(next: number): Pt {
  const to = FOREST[Math.min(next, FOREST.length - 1)];
  const from = next > 0 ? FOREST[next - 1] : ENTRANCE;
  return { x: from.x + (to.x - from.x) * 0.62, y: from.y + (to.y - from.y) * 0.62 + 3 };
}
/** Farther stops (higher on the picture) are drawn smaller, like in perspective. */
const depth = (y: number) => Math.min(1, 0.68 + 0.32 * (y / 80));
/** A full-box layer moved by translate(%) — % of its own size = % of the picture (GPU-only). */
const at = (p: Pt): CSSProperties => ({ transform: `translate(${p.x}%, ${p.y}%)` });

export function Forest() {
  const p = useProgress();
  const navigate = useNavigate();
  const next = nextStopIndex(p);
  const allDone = next >= FOREST.length;
  const celebrate = allDone && !p.forestCelebrated;
  const [shake, setShake] = useState<string | null>(null);

  const target = foxSpot(next);
  const start = reduced() ? target : (lastFox ?? ENTRANCE);
  const walks = start.x !== target.x || start.y !== target.y;
  const [fox, setFox] = useState<Pt>(start);
  const [arrived, setArrived] = useState(!walks);
  const [celebrateCard, setCelebrateCard] = useState(reduced());

  useEffect(() => {
    lastFox = target;
    const timers: number[] = [];
    if (walks) {
      timers.push(window.setTimeout(() => setFox(target), 250));
      timers.push(window.setTimeout(() => setArrived(true), 250 + 1700));
    }
    timers.push(
      window.setTimeout(
        () => {
          if (celebrate) {
            void sfx("fanfare");
            void say(["forest-done"]);
          } else if (!allDone) void say(["forest-next"]);
        },
        walks && !celebrate ? 1500 : 450,
      ),
    );
    if (celebrate) timers.push(window.setTimeout(() => setCelebrateCard(true), 2600));
    return () => timers.forEach((t) => window.clearTimeout(t));
    // only when the screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipped = target.x > FOREST[Math.min(next, FOREST.length - 1)].x;
  const goingLeft = target.x < start.x;

  return (
    <Scene
      bg="bg-forest"
      className={`forest-screen ${celebrate ? "is-night" : ""}`}
      boxed={
        <>
          <ForestAmbient />
          {FOREST.map((stop, i) => {
            const open = stopOpen(p, i);
            const done = Boolean(p.done[stop.id]);
            const isNext = i === next;
            return (
              <button
                key={stop.id}
                type="button"
                data-stop={stop.id}
                className={[
                  "stop",
                  done ? "is-done" : "",
                  isNext ? "is-next" : "",
                  isNext && arrived ? "is-greeting" : "",
                  open ? "" : "is-locked",
                  shake === stop.id ? "is-shaking" : "",
                ].join(" ")}
                style={
                  {
                    left: `${stop.x}%`,
                    top: `${stop.y}%`,
                    "--s": depth(stop.y),
                    "--d": `${(i * 0.37) % 2}s`,
                  } as CSSProperties
                }
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
                <span className="stop-body">
                  <Pic
                    name={stop.resident + (done ? "-happy" : isNext ? "-sad" : "")}
                    className="stop-pic"
                  />
                </span>
                {done && !celebrate && <Pic name="star" className="stop-star" />}
                <span className="stop-num" aria-hidden>
                  {i + 1}
                </span>
              </button>
            );
          })}
          {!allDone && (
            <div className={`fox-track ${arrived ? "is-arrived" : "is-walking"}`} style={at(fox)}>
              <span
                className={`forest-fox-wrap ${(arrived ? flipped : goingLeft) ? "is-flipped" : ""}`}
              >
                <Fox pose={arrived ? "wave" : "walk"} className="forest-fox" />
              </span>
            </div>
          )}
          {celebrate && <div className="night" aria-hidden />}
          {celebrate &&
            FOREST.map((stop, i) => (
              <div
                key={stop.id}
                className="sky-star-track"
                style={
                  {
                    "--from": `translate(${stop.x}%, ${stop.y}%)`,
                    "--to": `translate(${10 + i * 10}%, ${16 + (i % 2) * 3 + Math.abs(4 - i) * 1.3}%)`,
                    "--delay": `${0.2 + i * 0.16}s`,
                  } as CSSProperties
                }
              >
                <Pic name="star" className="sky-star" />
              </div>
            ))}
        </>
      }
    >
      <div className="top-bar">
        <BackButton to="/map" label="На карту" />
        <StarCount n={starsIn(p)} total={FOREST.length} />
        <ParentsButton />
      </div>
      {allDone && !celebrate && (
        <button
          type="button"
          className="glade-btn"
          onClick={() => {
            void sfx("step");
            void navigate({ to: "/glade" });
          }}
        >
          <Pic name="mushroom" className="glade-btn-pic" />
          <span>Лесная полянка</span>
        </button>
      )}
      {celebrate && (
        <div className="celebrate" role="dialog" aria-label="Лес пройден">
          {celebrateCard && (
            <div className="celebrate-card">
              <Fox pose="cheer" className="celebrate-fox" />
              <h2>Звёзды вернулись на небо!</h2>
              <p>Весь лес сияет. Скоро лисёнок отправится к морю.</p>
              <button
                type="button"
                className="big-btn"
                onClick={() => {
                  void sfx("tap");
                  update((s) => ({ ...s, forestCelebrated: true }));
                  void say(["glade-open"]);
                }}
              >
                Ура!
              </button>
            </div>
          )}
        </div>
      )}
    </Scene>
  );
}

/** Falling leaves, a sparkling stream and fireflies — CSS transforms/opacity only. */
const LEAVES = [
  { x: 12, d: 0, t: 11, pic: "leaf" },
  { x: 34, d: 4, t: 13, pic: "t-maple" },
  { x: 58, d: 7.5, t: 12, pic: "leaf" },
  { x: 80, d: 2, t: 14, pic: "t-maple" },
  { x: 92, d: 9, t: 12.5, pic: "leaf" },
];
const SPARKLES = [
  [24, 38],
  [30, 39.5],
  [37, 40.5],
  [44, 42],
  [53, 44],
  [60, 45.5],
  [67, 47],
  [74, 48.5],
  [81, 49.5],
  [20, 37.5],
];
const FLIES = [
  [8, 30],
  [88, 26],
  [14, 62],
  [90, 70],
  [70, 88],
  [22, 88],
  [52, 52],
  [6, 46],
];
function ForestAmbient() {
  return (
    <div className="ambient" aria-hidden>
      {SPARKLES.map(([x, y], i) => (
        <span
          key={`s${i}`}
          className="sparkle"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * 0.53) % 2.4}s` }}
        />
      ))}
      {FLIES.map(([x, y], i) => (
        <span
          key={`f${i}`}
          className={`firefly f${i % 4}`}
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.8}s` }}
        />
      ))}
      {LEAVES.map((l, i) => (
        <span
          key={`l${i}`}
          className="leaf-fall"
          style={{ left: `${l.x}%`, animationDelay: `${l.d}s`, animationDuration: `${l.t}s` }}
        >
          <Pic name={l.pic} className="leaf-pic" />
        </span>
      ))}
    </div>
  );
}
