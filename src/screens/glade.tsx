import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FOREST } from "../content/forest";
import { FINDS, nextFind } from "../content/glade";
import { wordKey } from "../content/voice";
import { BackButton, Fox, Pic, Scene } from "../components/kit";
import { TaskView, type Mood } from "../components/tasks";
import { say, setScene, sfx, stopVoice } from "../game/audio";
import {
  addFind,
  forestDone,
  getProgress,
  recordTask,
  weakSkills,
  weakWordIds,
} from "../game/progress";
import { makePractice, type Task } from "../game/tasks";

type Phase = "hello" | "task" | "find";
const newRound = () => {
  const p = getProgress();
  return makePractice(p.settings.level, weakSkills(p), weakWordIds(p));
};

/** Лесная полянка: endless practice after the forest — weak skills and words first, then review. */
export function Glade() {
  const navigate = useNavigate();
  const allowed = forestDone(getProgress());
  useEffect(() => {
    if (!allowed) void navigate({ to: "/forest", replace: true });
  }, [allowed, navigate]);
  useEffect(() => () => stopVoice(), []);
  return allowed ? <GladeGame /> : null;
}

function GladeGame() {
  const [phase, setPhase] = useState<Phase>("hello");
  const [round, setRound] = useState<Task[]>(newRound);
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [find, setFind] = useState<(typeof FINDS)[number] | null>(null);
  const [all, setAll] = useState(false);
  const roundNo = useRef(0);
  const friend = FOREST[roundNo.current % FOREST.length].resident;

  useEffect(() => {
    setScene(phase === "task" ? "tasks" : phase === "find" ? "celebrate" : "map");
  }, [phase]);
  useEffect(() => () => setScene("map"), []);
  useEffect(() => {
    if (phase !== "hello") return;
    const t = window.setTimeout(() => void say(["glade-hello"]), 400);
    return () => window.clearTimeout(t);
  }, [phase]);

  const solved = (m: number, hinted: boolean) => {
    const task = round[step];
    recordTask(task.skill, m, hinted, task.word);
    if (step + 1 < round.length) {
      setStep(step + 1);
      return;
    }
    const before = getProgress().finds;
    const f = nextFind(before);
    const completes = FINDS.every((x) => x.id === f.id || before[x.id]) && !before[f.id];
    addFind(f.id);
    setFind(f);
    setAll(completes);
    setPhase("find");
    void sfx("star");
    void say(["glade-find", wordKey(f.id), ...(completes ? ["glade-all"] : []), "glade-more"]);
  };

  const again = () => {
    void sfx("tap");
    stopVoice();
    roundNo.current++;
    setRound(newRound());
    setStep(0);
    setMood("idle");
    setPhase("task");
  };

  const foxPose = mood === "happy" ? "cheer" : mood === "oops" ? "think" : "point";
  const residentPose = mood === "happy" ? "-happy" : mood === "oops" ? "-sad" : "-happy";
  const found = Object.keys(getProgress().finds).length;

  return (
    <Scene bg="bg-clearing" className={`stop-screen glade-screen phase-${phase}`}>
      <div className="top-bar">
        <BackButton to="/forest" label="К тропинке" />
        <div className="dots" aria-label={`Задание ${step + 1} из ${round.length}`}>
          {round.map((_, i) => (
            <span
              key={i}
              className={`dot ${i < step || phase === "find" ? "is-done" : ""} ${i === step && phase === "task" ? "is-now" : ""}`}
            />
          ))}
        </div>
        <span className="top-spacer" />
      </div>

      {phase === "hello" && (
        <div className="glade-hello">
          <div className="bubble from-fox glade-bubble">
            <span className="bubble-name">Лесная полянка</span>
            <p>Здесь можно играть сколько захочешь. После каждых пяти заданий — находка!</p>
          </div>
          <p className="glade-count">
            Находки: {found} из {FINDS.length}
          </p>
          <Fox pose="wave" className="glade-fox" />
          <button type="button" className="big-btn help-btn is-ready glade-play" onClick={again}>
            Играть!
          </button>
        </div>
      )}

      {phase === "task" && (
        <>
          <TaskView
            key={`${roundNo.current}-${step}`}
            task={round[step]}
            onSolved={solved}
            onMood={setMood}
          />
          <div className="task-friends" aria-hidden>
            <Pic name={friend + residentPose} className={`friend-resident mood-${mood}`} />
            <Fox pose={foxPose} className={`friend-fox mood-${mood}`} />
          </div>
        </>
      )}

      {phase === "find" && find && (
        <div className="reward glade-find" role="dialog" aria-label="Находка">
          <div className="reward-rays" aria-hidden />
          <Pic name={find.pic} className="find-pic" />
          <h2>Находка: {find.name.toLowerCase()}!</h2>
          {all && <p className="level-note">Все находки полянки собраны!</p>}
          <p className="glade-count">
            Находки: {Object.keys(getProgress().finds).length} из {FINDS.length}
          </p>
          <div className="glade-actions">
            <button type="button" className="big-btn next-btn glade-again" onClick={again}>
              Ещё!
            </button>
          </div>
        </div>
      )}
    </Scene>
  );
}
