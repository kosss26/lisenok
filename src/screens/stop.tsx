import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { type Stop } from "../content/forest";
import { ALL_STOPS, findStop, type World } from "../content/worlds";
import { StopWeather } from "../components/weather";
import { introKey, outroKey, youngId } from "../content/voice";
import { useDialogue } from "../game/dialogue";
import { BackButton, Fox, Pic, Scene, type FoxPose } from "../components/kit";
import { TaskView, type Guide, type Mood } from "../components/tasks";
import { TaskFriends } from "../components/friends";
import { DifficultyBadge } from "../components/difficulty";
import { PlaceStar } from "../components/sky";
import { giftKey } from "../content/voice";
import { say, setScene, sfx, stopVoice } from "../game/audio";
import {
  easeNow,
  finishStop,
  freeSkySpot,
  getProgress,
  placeStar,
  recordTask,
  stopOpen,
  tuneFor,
  worldOpen,
  weakWordIds,
} from "../game/progress";
import { makeRound, type Task } from "../game/tasks";

type Phase = "hello" | "task" | "reward";

export function StopScreen() {
  // the same screen serves /forest/$stopId and /sea/$stopId
  const { stopId = "" } = useParams({ strict: false }) as { stopId?: string };
  const navigate = useNavigate();
  const found = findStop(stopId);
  const p = getProgress();
  const allowed =
    found && worldOpen(p, found.world.id) && stopOpen(p, found.index, found.world.stops);

  useEffect(() => {
    if (!allowed)
      void navigate({
        to: found && worldOpen(p, found.world.id) ? `/${found.world.id}` : "/map",
        replace: true,
        // a redirect, not a move: no crossfade (it would be cut short by the next screen)
        viewTransition: false,
      });
  }, [allowed, navigate, found, p]);
  useEffect(() => () => stopVoice(), []);

  if (!allowed) return null;
  return <StopGame key={found.stop.id} world={found.world} stopIndex={found.index} />;
}

function StopGame({ world, stopIndex }: { world: World; stopIndex: number }) {
  const stop = world.stops[stopIndex];
  const back = `/${world.id}`;
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("hello");
  useEffect(() => {
    setScene(phase === "task" ? "tasks" : phase === "reward" ? "celebrate" : "map");
  }, [phase]);
  useEffect(() => () => setScene("map"), []);
  const [round, setRound] = useState<Task[]>(() =>
    makeRound(
      skillFor(stop),
      tuneFor(getProgress(), stopIndex, world),
      Math.random,
      weakWordIds(getProgress()),
    ),
  );
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [guide, setGuide] = useState<Guide>(null);
  const [reward, setReward] = useState<{ first: boolean; toPlace: boolean } | null>(null);
  const mistakes = useRef(0);

  const solved = (m: number, hinted: boolean) => {
    recordTask(round[step].skill, m, hinted, round[step].word);
    mistakes.current += m + (hinted && m === 0 ? 1 : 0);
    if (step + 1 < round.length) {
      // a mistake: the rest of the round gets easier at once (the automatic shift goes down)
      if (m >= 1 && getProgress().settings.auto) {
        easeNow(Math.min(0.15, 0.05 * m));
        const easier = makeRound(
          skillFor(stop),
          tuneFor(getProgress(), stopIndex, world),
          Math.random,
          weakWordIds(getProgress()),
        );
        setRound([...round.slice(0, step + 1), ...easier.slice(step + 1)]);
      }
      setStep(step + 1);
      return;
    }
    const r = finishStop(stop.id, mistakes.current);
    const toPlace = !getProgress().sky[stop.id];
    setReward({ ...r, toPlace });
    setStarUp(!toPlace);
    setPhase("reward");
    void sfx("star");
    if (toPlace) window.setTimeout(() => void say(["sky-place"]), 600);
  };
  /** the star hangs in the sky (or was there already): now the gift and the thanks */
  const [starUp, setStarUp] = useState(false);

  return (
    <Scene
      bg={world.stopBg}
      className={`stop-screen phase-${phase}`}
      boxed={<StopWeather time={world.time(stopIndex)} weather={world.weather(stopIndex)} />}
    >
      <div className="top-bar">
        <BackButton to={back} label="К тропинке" />
        <div className="dots" aria-label={`Задание ${step + 1} из ${round.length}`}>
          {round.map((_, i) => (
            <span
              key={i}
              className={`dot ${i < step || phase === "reward" ? "is-done" : ""} ${i === step && phase === "task" ? "is-now" : ""}`}
            />
          ))}
        </div>
        <DifficultyBadge />
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
          <TaskView
            key={step}
            task={round[step]}
            onSolved={solved}
            onMood={setMood}
            onGuide={setGuide}
          />
          <TaskFriends who={stop.resident} name={stop.name} mood={mood} guide={guide} />
        </>
      )}

      {phase === "reward" && reward && (
        <div className="reward" role="dialog" aria-label="Награда">
          <div className="reward-rays" aria-hidden />
          {reward.toPlace ? (
            <PlaceStar
              stopId={stop.id}
              onPlaced={() => window.setTimeout(() => setStarUp(true), 900)}
            />
          ) : (
            <Pic name="star-face" className="reward-star" />
          )}
          <h2>{reward.first ? "Звёздочка твоя!" : "Ты снова помог!"}</h2>
          {starUp && (
            <>
              <button
                type="button"
                className="gift"
                onClick={() => {
                  void sfx("pick");
                  void say([giftKey(stop.id)]);
                }}
              >
                <Pic name={stop.gift} className="gift-pic" />
                <span>
                  {reward.first ? `Подарок: ${stop.giftName.toLowerCase()}` : stop.giftName}
                </span>
              </button>
              <Outro stop={stop} />
            </>
          )}
          <button
            type="button"
            className="big-btn next-btn"
            onClick={() => {
              void sfx("tap");
              stopVoice();
              // a star the child did not hang up yet gets a free spot in the sky
              if (!getProgress().sky[stop.id])
                placeStar(
                  stop.id,
                  ...freeSkySpot(getProgress(), ALL_STOPS.findIndex((s) => s.id === stop.id) + 1),
                );
              void navigate({ to: back });
            }}
          >
            Дальше
          </button>
        </div>
      )}
    </Scene>
  );
}

/** 5–6-year-olds play the stop's own no-arithmetic skill (the one its young dialogue talks about) */
const skillFor = (stop: Stop) =>
  getProgress().settings.level === 1 && stop.young ? stop.young.skill : stop.skill;

const residentPic = (stop: Stop, pose: string) => stop.resident + (pose ? `-${pose}` : "");

/** The resident and the fox talk before the tasks: voiced lines, poses change with each line. */
function Hello({ stop, onHelp }: { stop: Stop; onHelp: () => void }) {
  // 5–6-year-olds get the stop's no-arithmetic version (another skill, other words)
  const young = getProgress().settings.level === 1 && stop.young;
  const intro = young ? young.intro : stop.intro;
  const keys = intro.map((_, i) => introKey(young ? youngId(stop.id) : stop.id, i));
  const { index, finished, next } = useDialogue(keys);
  const line = intro[index];
  const seen = intro.slice(0, index + 1);
  const resPose = seen.filter((l) => l.who === "res").pop()?.pose ?? "sad";
  // while the resident talks the fox reacts: listens to a worry, nods at a request, claps for joy
  const foxPose: FoxPose =
    line.who === "fox"
      ? line.pose
      : line.pose === "sad"
        ? "listen"
        : line.pose === "happy"
          ? "clap"
          : "nod";

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
function Outro({ stop }: { stop: Stop }) {
  const keys = [outroKey(stop.id, 0), outroKey(stop.id, 1)];
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
