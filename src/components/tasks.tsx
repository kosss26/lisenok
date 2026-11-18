/** The task views: multiple choice (letters, numbers, pictures, words, signs, groups) and word building. */
import { useEffect, useRef, useState } from "react";
import { NAMES } from "../content/names";
import { numKey, shown, sylKey, voiceLines } from "../content/voice";
import { AGAIN, PRAISE } from "../content/voice";
import { say, sfx } from "../game/audio";
import { getProgress } from "../game/progress";
import type { BuildTask, ChoiceTask, Option, Task, Visual } from "../game/tasks";
import { Pic, SpeakerIcon } from "./kit";
import { IconBulb } from "./icons";

const LINES = voiceLines();
const rnd = (n: number) => 1 + Math.floor(Math.random() * n);

/** Praise line; now and then with the child's name. */
function praise() {
  const name = NAMES.find((n) => n.id === getProgress().settings.name);
  if (name && Math.random() < 0.35) return `name-${name.id}-bravo`;
  return `praise-${rnd(PRAISE)}`;
}

export type Solved = (mistakes: number, hinted: boolean) => void;
export type Mood = "idle" | "happy" | "oops";

export function TaskView({
  task,
  onSolved,
  onMood,
}: {
  task: Task;
  onSolved: Solved;
  onMood: (m: Mood) => void;
}) {
  return task.kind === "choice" ? (
    <Choice task={task} onSolved={onSolved} onMood={onMood} />
  ) : (
    <Build task={task} onSolved={onSolved} onMood={onMood} />
  );
}

function PromptBar({
  task,
  onRepeat,
  onHint,
}: {
  task: Task;
  onRepeat: () => void;
  onHint: () => void;
}) {
  return (
    <div className="prompt">
      <button
        type="button"
        className="round-btn repeat-btn"
        aria-label="Повторить задание"
        onClick={onRepeat}
      >
        <SpeakerIcon />
      </button>
      <p className="prompt-text">{shown(LINES[task.prompt[0]])}</p>
      <button type="button" className="round-btn hint-btn" aria-label="Подсказка" onClick={onHint}>
        <IconBulb />
      </button>
    </div>
  );
}

/** Shared answer logic: mistakes, hint after the 2nd, show the answer after the 3rd. */
function useAnswering(task: Task, onSolved: Solved, onMood: (m: Mood) => void) {
  const [mistakes, setMistakes] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [solved, setSolved] = useState(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    const t = window.setTimeout(() => void say(task.prompt), 350);
    return () => {
      live.current = false;
      window.clearTimeout(t);
    };
  }, [task]);

  const hint = () => {
    setHinted(true);
    void say(task.hint);
  };
  const wrong = (spoken?: string) => {
    const m = mistakes + 1;
    setMistakes(m);
    void sfx("wrong", 0.55);
    onMood("oops");
    window.setTimeout(() => live.current && onMood("idle"), 1200);
    const before = spoken ? [spoken] : [];
    if (m === 2) {
      setHinted(true);
      void say([...before, ...task.hint]);
    } else if (m >= 3) void say([...before, "show-answer"]);
    else void say([...before, `again-${rnd(AGAIN)}`]);
  };
  const right = (spoken: string[] = []) => {
    setSolved(true);
    void sfx("right");
    onMood("happy");
    const started = Date.now();
    void say([...spoken, praise()]).then(() => {
      const wait = Math.max(0, 1300 - (Date.now() - started));
      window.setTimeout(() => {
        if (!live.current) return;
        onMood("idle");
        onSolved(mistakes, hinted);
      }, wait + 250);
    });
  };
  return {
    mistakes,
    hinted,
    solved,
    hint,
    wrong,
    right,
    showHint: hinted || mistakes >= 2,
    reveal: mistakes >= 3,
  };
}

// ---------------- choice ----------------
function Choice({
  task,
  onSolved,
  onMood,
}: {
  task: ChoiceTask;
  onSolved: Solved;
  onMood: (m: Mood) => void;
}) {
  const a = useAnswering(task, onSolved, onMood);
  const [off, setOff] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);

  const tap = (o: Option) => {
    if (a.solved || off.includes(o.id)) return;
    if (o.id === task.answer) {
      setPicked(o.id);
      a.right(o.say ? [o.say] : []);
    } else {
      setOff((x) => [...x, o.id]);
      setShaking(o.id);
      window.setTimeout(() => setShaking(null), 500);
      a.wrong(o.say);
    }
  };

  return (
    <div className={`task task-${task.skill} layout-${task.layout}`}>
      <PromptBar task={task} onRepeat={() => void say(task.prompt)} onHint={a.hint} />
      <VisualCard
        visual={task.visual}
        task={task}
        picked={picked}
        onListen={() => void say(task.prompt)}
      />
      <div className={`options options-${task.layout} n${task.options.length}`}>
        {task.options.map((o) => {
          const isAnswer = o.id === task.answer;
          return (
            <button
              key={o.id}
              type="button"
              className={[
                "option",
                off.includes(o.id) ? "is-off" : "",
                picked === o.id ? "is-right" : "",
                shaking === o.id ? "is-shaking" : "",
                a.showHint && isAnswer && !a.solved ? "is-hint" : "",
                a.reveal && isAnswer && !a.solved ? "is-reveal" : "",
              ].join(" ")}
              data-answer={isAnswer ? "1" : undefined}
              data-option={o.id}
              aria-label={o.label ?? o.id}
              onClick={() => tap(o)}
            >
              {task.layout === "groups" && o.pic && o.count ? (
                <span className="group">
                  {Array.from({ length: o.count }, (_, i) => (
                    <Pic key={i} name={o.pic!} className="group-pic" />
                  ))}
                </span>
              ) : o.pic ? (
                <Pic name={o.pic} className="option-pic" />
              ) : (
                <span className="option-label">{o.label}</span>
              )}
              {picked === o.id && <Burst />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VisualCard({
  visual,
  task,
  picked,
  onListen,
}: {
  visual: Visual;
  task: ChoiceTask;
  picked: string | null;
  onListen: () => void;
}) {
  switch (visual.type) {
    case "listen":
      return (
        <div className="card card-listen">
          <button
            type="button"
            className="listen-btn"
            aria-label="Послушать ещё раз"
            onClick={onListen}
          >
            <SpeakerIcon />
          </button>
          <span className="card-caption">Послушай</span>
        </div>
      );
    case "picture":
      return (
        <div className="card card-picture">
          <Pic name={visual.pic} className="card-pic" />
          {visual.text && (
            <div className="gap-word">
              {[...visual.text].map((c, i) =>
                c === "_" ? (
                  <span key={i} className={`gap ${picked ? "is-filled" : ""}`}>
                    {picked ?? ""}
                  </span>
                ) : (
                  <span key={i}>{c}</span>
                ),
              )}
            </div>
          )}
        </div>
      );
    case "word":
      return (
        <div className="card card-word">
          <span className="paper-word">{visual.text}</span>
        </div>
      );
    case "sentence":
      return (
        <div className="card card-sentence">
          <p className="paper-sentence">{visual.text}</p>
        </div>
      );
    case "count":
      return <CountCard visual={visual} />;
    case "math":
      return <MathCard visual={visual} picked={picked} />;
    case "compare":
      return (
        <div className="card card-compare">
          <span className="cmp-side">{visual.left}</span>
          <span className={`cmp-box ${picked ? "is-filled" : ""}`}>{picked ?? "?"}</span>
          <span className="cmp-side">{visual.right}</span>
        </div>
      );
  }
  void task;
}

/** Objects to count: tap each one and the voice counts along. */
function CountCard({ visual }: { visual: Extract<Visual, { type: "count" }> }) {
  const [marked, setMarked] = useState<number[]>([]);
  const tens = visual.mode === "tens" ? Math.floor(visual.n / 10) : 0;
  const ones = visual.mode === "tens" ? visual.n % 10 : visual.n;
  const mark = (i: number, value: number) => {
    if (marked.includes(i)) return;
    const next = [...marked, i];
    setMarked(next);
    void sfx("pick", 0.6);
    void say([numKey(value)], 0);
  };
  // running total in the order the child taps (tens strips count 10)
  const totalFor = (i: number) => [...marked, i].reduce((s, k) => s + (k < 1000 ? 1 : 10), 0);
  return (
    <div className={`card card-count count-${visual.mode}`}>
      {tens > 0 && (
        <div className="tens">
          {Array.from({ length: tens }, (_, t) => {
            const id = 1000 + t;
            return (
              <button
                key={id}
                type="button"
                className={`ten-strip ${marked.includes(id) ? "is-marked" : ""}`}
                aria-label="десяток"
                onClick={() => mark(id, totalFor(id))}
              >
                {Array.from({ length: 10 }, (_, k) => (
                  <Pic key={k} name={visual.pic} className="ten-pic" />
                ))}
              </button>
            );
          })}
        </div>
      )}
      <div className={`ones ones-${visual.mode}`}>
        {Array.from({ length: ones }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`count-item ${marked.includes(i) ? "is-marked" : ""}`}
            aria-label="посчитать"
            onClick={() => mark(i, totalFor(i))}
          >
            <Pic name={visual.pic} className="count-pic" />
            {marked.includes(i) && visual.mode !== "tens" && (
              <span className="count-badge">{marked.indexOf(i) + 1}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MathCard({
  visual,
  picked,
}: {
  visual: Extract<Visual, { type: "math" }>;
  picked: string | null;
}) {
  const { a, b, op, pic } = visual;
  return (
    <div className={`card card-math ${pic ? "with-pics" : ""}`}>
      {pic && (
        <div className="math-pics">
          {op === "+" ? (
            <>
              <span className="math-group">
                {Array.from({ length: a }, (_, i) => (
                  <Pic key={i} name={pic} className="math-pic" />
                ))}
              </span>
              <span className="math-group is-new">
                {Array.from({ length: b }, (_, i) => (
                  <Pic key={i} name={pic} className="math-pic" />
                ))}
              </span>
            </>
          ) : (
            <span className="math-group">
              {Array.from({ length: a }, (_, i) => (
                <Pic key={i} name={pic} className={`math-pic ${i >= a - b ? "is-gone" : ""}`} />
              ))}
            </span>
          )}
        </div>
      )}
      <div className="math-line">
        <span>{a}</span>
        <span className="math-op">{op === "+" ? "+" : "−"}</span>
        <span>{b}</span>
        <span className="math-op">=</span>
        <span className={`math-answer ${picked ? "is-filled" : ""}`}>{picked ?? "?"}</span>
      </div>
    </div>
  );
}

// ---------------- build a word ----------------
function Build({
  task,
  onSolved,
  onMood,
}: {
  task: BuildTask;
  onSolved: Solved;
  onMood: (m: Mood) => void;
}) {
  const a = useAnswering(task, onSolved, onMood);
  const [used, setUsed] = useState<number[]>([]);
  const [shaking, setShaking] = useState<number | null>(null);
  /** slots whose letter has landed (the letter flies there from its tile first) */
  const [landed, setLanded] = useState<number[]>([]);
  const [flying, setFlying] = useState<Flight[]>([]);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pieceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const placed = used.length;
  const done = placed === task.target.length;
  const nextIdx = task.pieces.findIndex((p, i) => !used.includes(i) && p === task.target[placed]);

  const tap = (i: number) => {
    if (done || used.includes(i)) return;
    if (task.pieces[i] === task.target[placed]) {
      const next = [...used, i];
      const slot = placed;
      const from = pieceRefs.current[i]?.getBoundingClientRect();
      const to = slotRefs.current[slot]?.getBoundingClientRect();
      if (from && to && !reducedMotion()) {
        setFlying((f) => [...f, { id: slot, text: task.pieces[i], from, to }]);
      } else setLanded((l) => [...l, slot]);
      setUsed(next);
      if (next.length === task.target.length) {
        a.right([task.prompt[1]]);
      } else {
        void sfx("pick");
        if (task.unit === "syllable") void say([sylKey(task.pieces[i])], 0);
      }
    } else {
      setShaking(i);
      window.setTimeout(() => setShaking(null), 500);
      a.wrong();
    }
  };

  const land = (slot: number) => {
    setFlying((f) => f.filter((x) => x.id !== slot));
    setLanded((l) => [...l, slot]);
  };

  return (
    <div className={`task task-${task.skill} task-build unit-${task.unit}`}>
      <PromptBar task={task} onRepeat={() => void say(task.prompt)} onHint={a.hint} />
      <div className="card card-build">
        <Pic name={task.pic} className="card-pic" />
        <div className={`slots n${task.target.length}`}>
          {task.target.map((piece, i) => (
            <span
              key={i}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className={`slot ${i < placed ? "is-filled" : ""} ${landed.includes(i) ? "is-landed" : ""} ${i === placed && !done ? "is-current" : ""}`}
            >
              {landed.includes(i) ? (
                piece
              ) : task.ghost ? (
                <span className="ghost">{piece}</span>
              ) : (
                ""
              )}
            </span>
          ))}
        </div>
        {done && landed.length === task.target.length && <Burst />}
      </div>
      {flying.map((f) => (
        <FlyingPiece key={f.id} flight={f} onLanded={() => land(f.id)} />
      ))}
      <div className={`pieces n${task.pieces.length}`}>
        {task.pieces.map((piece, i) => (
          <button
            key={i}
            type="button"
            className={[
              "piece",
              used.includes(i) ? "is-used" : "",
              shaking === i ? "is-shaking" : "",
              a.showHint && i === nextIdx && !done ? "is-hint" : "",
            ].join(" ")}
            data-answer={i === nextIdx ? "1" : undefined}
            aria-label={piece}
            ref={(el) => {
              pieceRefs.current[i] = el;
            }}
            onClick={() => tap(i)}
          >
            {piece}
          </button>
        ))}
      </div>
    </div>
  );
}

type Flight = { id: number; text: string; from: DOMRect; to: DOMRect };
const reducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A tile that springs from the table into its slot (Web Animations, transform only). */
function FlyingPiece({ flight, onLanded }: { flight: Flight; onLanded: () => void }) {
  const done = useRef(onLanded);
  done.current = onLanded;
  const { from, to } = flight;
  return (
    <span
      className="flying-piece"
      style={{ left: from.left, top: from.top, width: from.width, height: from.height }}
      ref={(el) => {
        if (!el || el.dataset.go) return;
        el.dataset.go = "1";
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const s = Math.min(1, to.height / from.height);
        const anim = el.animate(
          [
            { transform: "translate(0, 0) scale(1) rotate(0deg)" },
            {
              transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(1.15) rotate(-8deg)`,
              offset: 0.45,
            },
            { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0deg)` },
          ],
          { duration: 420, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)", fill: "forwards" },
        );
        anim.onfinish = () => done.current();
      }}
    >
      {flight.text}
    </span>
  );
}

/** Little stars bursting out of a right answer. */
const BURST = Array.from({ length: 10 }, (_, i) => i);
export function Burst() {
  return (
    <span className="burst" aria-hidden>
      {BURST.map((i) => (
        <Pic key={i} name="star" className="burst-star" alt="" />
      ))}
    </span>
  );
}
