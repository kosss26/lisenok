import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Fox, ParentsButton, Pic, Scene } from "../components/kit";
import { say, sfx, startMusic, stopVoice, unlockAudio } from "../game/audio";
import { update, useProgress } from "../game/progress";
import { markGreeted } from "../game/greeting";

export function Title() {
  const p = useProgress();
  const navigate = useNavigate();
  const [story, setStory] = useState(false);

  const go = () => {
    stopVoice();
    update((s) => ({ ...s, intro: true }));
    void navigate({ to: "/map" });
  };

  return (
    <Scene bg="bg-clearing" className="title-screen">
      <div className="title-sky" />
      <ParentsButton />
      <div className="title-stars" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Pic key={i} name="star-glow" className={`title-star s${i}`} />
        ))}
      </div>
      <h1 className="title-logo">
        <span>Лисёнок</span>
        <em>и звёзды</em>
      </h1>
      <Fox pose="wave" className="title-fox" />
      {!story && (
        <button
          type="button"
          className="big-btn play-btn"
          onClick={() => {
            unlockAudio();
            void sfx("tap");
            startMusic();
            if (!p.intro) {
              setStory(true);
              void say(["intro"]);
            } else {
              markGreeted(false);
              go();
            }
          }}
        >
          Играть
        </button>
      )}
      {story && (
        <div className="story-card" role="dialog" aria-label="История">
          <Pic name="star-face" className="story-star" />
          <p>
            Однажды ночью с неба упали звёзды и рассыпались по всему свету. Лисёнок хочет вернуть их
            домой, на небо. Поможешь ему?
          </p>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              void sfx("tap");
              markGreeted(true);
              go();
            }}
          >
            Помогу!
          </button>
        </div>
      )}
    </Scene>
  );
}
