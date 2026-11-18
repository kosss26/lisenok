import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FOREST } from "../content/forest";
import { BackButton, Fox, Pic, Scene } from "../components/kit";
import { TaskView, type Mood } from "../components/tasks";
import { say, sfx, stopVoice } from "../game/audio";
import { finishStop, getProgress, recordTask, stopOpen } from "../game/progress";
import { makeRound, type Task } from "../game/tasks";
import { stopRoute } from "../router";

type Phase = "hello" | "task" | "reward";

export function StopScreen() {
  const { stopId } = stopRoute.useParams();
  const navigate = useNavigate();
  const index = FOREST.findIndex((s) => s.id === stopId);
  const stop = FOREST[index];
  const allowed = stop && stopOpen(getProgress(), index);

  useEffect(() => {
    if (!allowed) void navigate({ to: "/forest", replace: true });
  }, [allowed, navigate]);
  useEffect(() => () => stopVoice(), []);

  if (!allowed) return null;
  return <StopGame key={stop.id} stopIndex={index} />;
}

function StopGame({ stopIndex }: { stopIndex: number }) {
  const stop = FOREST[stopIndex];
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("hello");
  const [round] = useState<Task[]>(() => makeRound(stop.skill, getProgress().settings.level));
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [reward, setReward] = useState<{ first: boolean; level: "up" | "down" | null } | null>(
    null,
  );
  const mistakes = useRef(0);

  useEffect(() => {
    if (phase !== "hello") return;
    const t = window.setTimeout(() => void say([`hello-${stop.id}`]), 300);
    return () => window.clearTimeout(t);
  }, [phase, stop.id]);

  const solved = (m: number, hinted: boolean) => {
    recordTask(stop.skill, m, hinted);
    mistakes.current += m + (hinted && m === 0 ? 1 : 0);
    if (step + 1 < round.length) {
      setStep(step + 1);
      return;
    }
    const r = finishStop(stop.id, mistakes.current);
    setReward(r);
    setPhase("reward");
    void sfx("star");
    window.setTimeout(
      () => void say([`thanks-${stop.id}`, ...(r.level === "up" ? ["level-up"] : [])]),
      700,
    );
  };

  const foxPose = mood === "happy" ? "cheer" : mood === "oops" ? "think" : "point";

  return (
    <Scene bg="bg-clearing" className={`stop-screen phase-${phase}`}>
      <div className="top-bar">
        <BackButton to="/forest" label="К тропинке" />
        <div className="dots" aria-label={`Задание ${step + 1} из ${round.length}`}>
          {round.map((_, i) => (
            <span
              key={i}
              className={`dot ${i < step || phase === "reward" ? "is-done" : ""} ${i === step && phase === "task" ? "is-now" : ""}`}
            />
          ))}
        </div>
        <span className="top-spacer" />
      </div>

      {phase === "hello" && (
        <div className="hello">
          <div className="bubble">
            <p>{stop.hello}</p>
          </div>
          <Pic name={stop.resident} className="hello-resident" alt={stop.name} />
          <button
            type="button"
            className="big-btn help-btn"
            onClick={() => {
              void sfx("tap");
              setPhase("task");
            }}
          >
            Помочь!
          </button>
        </div>
      )}

      {phase === "task" && (
        <>
          <TaskView key={step} task={round[step]} onSolved={solved} onMood={setMood} />
          <div className="task-friends" aria-hidden>
            <Pic name={stop.resident} className="friend-resident" />
            <Fox pose={foxPose} className={`friend-fox mood-${mood}`} />
          </div>
        </>
      )}

      {phase === "reward" && reward && (
        <div className="reward" role="dialog" aria-label="Награда">
          <div className="reward-rays" aria-hidden />
          <Pic name="star-face" className="reward-star" />
          <h2>{reward.first ? "Звёздочка твоя!" : "Ты снова помог!"}</h2>
          <div className="gift">
            <Pic name={stop.gift} className="gift-pic" />
            <span>{reward.first ? `Подарок: ${stop.giftName.toLowerCase()}` : stop.giftName}</span>
          </div>
          {reward.level === "up" && <p className="level-note">Задания станут чуть интереснее!</p>}
          <button
            type="button"
            className="big-btn next-btn"
            onClick={() => {
              void sfx("tap");
              stopVoice();
              void navigate({ to: "/forest" });
            }}
          >
            Дальше
          </button>
        </div>
      )}
    </Scene>
  );
}
