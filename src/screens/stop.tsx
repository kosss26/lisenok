import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FOREST, type Stop } from "../content/forest";
import { introKey, outroKey } from "../content/voice";
import { useDialogue } from "../game/dialogue";
import { BackButton, Fox, Pic, Scene } from "../components/kit";
import { TaskView, type Mood } from "../components/tasks";
import { sfx, stopVoice } from "../game/audio";
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
  };

  const foxPose = mood === "happy" ? "cheer" : mood === "oops" ? "think" : "point";
  const residentPose = mood === "happy" ? "-happy" : mood === "oops" ? "-sad" : "";

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
        <Hello
          stop={stop}
          onHelp={() => {
            void sfx("tap");
            stopVoice();
            setPhase("task");
          }}
        />
      )}

      {phase === "task" && (
        <>
          <TaskView key={step} task={round[step]} onSolved={solved} onMood={setMood} />
          <div className="task-friends" aria-hidden>
            <Pic name={stop.resident + residentPose} className={`friend-resident mood-${mood}`} />
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
          <Outro stop={stop} levelUp={reward.level === "up"} />
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

const residentPic = (stop: Stop, pose: string) => stop.resident + (pose ? `-${pose}` : "");

/** The resident and the fox talk before the tasks: voiced lines, poses change with each line. */
function Hello({ stop, onHelp }: { stop: Stop; onHelp: () => void }) {
  const keys = stop.intro.map((_, i) => introKey(stop.id, i));
  const { index, finished, next } = useDialogue(keys);
  const line = stop.intro[index];
  const seen = stop.intro.slice(0, index + 1);
  const resPose = seen.filter((l) => l.who === "res").pop()?.pose ?? "sad";
  const foxPose = seen.flatMap((l) => (l.who === "fox" ? [l.pose] : [])).pop() ?? "wave";

  return (
    <div className={`hello speaker-${line.who}`}>
      <button
        type="button"
        className={`bubble from-${line.who}`}
        key={index}
        onClick={next}
        aria-label="Дальше"
      >
        <span className="bubble-name">{line.who === "fox" ? "Лисёнок" : stop.name}</span>
        <p>{line.text}</p>
      </button>
      <div className="talkers">
        <Pic
          key={`r-${resPose}`}
          name={residentPic(stop, resPose)}
          className={`talker talker-res ${line.who === "res" ? "is-talking" : ""}`}
          alt={stop.name}
        />
        <Fox
          key={`f-${foxPose}`}
          pose={foxPose}
          className={`talker talker-fox ${line.who === "fox" ? "is-talking" : ""}`}
        />
      </div>
      <button
        type="button"
        className={`big-btn help-btn ${finished ? "is-ready" : ""}`}
        onClick={onHelp}
      >
        Помочь!
      </button>
    </div>
  );
}

/** After the star: the resident thanks, the fox answers. */
function Outro({ stop, levelUp }: { stop: Stop; levelUp: boolean }) {
  const keys = [outroKey(stop.id, 0), ...(levelUp ? ["level-up"] : []), outroKey(stop.id, 1)];
  const { index, next } = useDialogue(keys, { delay: 700 });
  const line = stop.outro[index === keys.length - 1 ? 1 : 0];
  return (
    <button
      type="button"
      className={`reward-talk from-${line.who}`}
      onClick={next}
      aria-label="Дальше"
    >
      {line.who === "res" ? (
        <Pic name={residentPic(stop, line.pose)} className="reward-talker" alt={stop.name} />
      ) : (
        <Fox pose={line.pose} className="reward-talker" />
      )}
      <span className="reward-say" key={line.text}>
        {line.text}
      </span>
    </button>
  );
}
