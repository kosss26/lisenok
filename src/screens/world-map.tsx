import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { WORLDS } from "../content/forest";
import { WORLD, WORLD_LIST, type WorldId } from "../content/worlds";
import { NAMES } from "../content/names";
import { Fox, ParentsButton, Pic, Scene, StarCount } from "../components/kit";
import { say, sfx } from "../game/audio";
import { IconLock, IconStar } from "../components/icons";
import { greeting } from "../game/greeting";
import {
  forestDone,
  getProgress,
  seaDone,
  starsIn,
  useProgress,
  worldOpen,
} from "../game/progress";

export function WorldMap() {
  const p = useProgress();
  const navigate = useNavigate();
  // the stars of every open world
  const open = WORLD_LIST.filter((w) => worldOpen(p, w.id));
  const stars = open.reduce((n, w) => n + starsIn(p, w.stops), 0);
  const total = open.reduce((n, w) => n + w.stops.length, 0);
  const playable = (id: string): id is WorldId => id in WORLD && worldOpen(p, id as WorldId);
  const [shake, setShake] = useState<string | null>(null);

  useEffect(() => {
    const name = NAMES.find((n) => n.id === getProgress().settings.name);
    const lines = greeting.done
      ? []
      : greeting.afterIntro
        ? ["map-pick"]
        : [name ? `name-${name.id}-hi` : "hi", "map-pick"];
    // once the forest is done the fox points to the sea
    const pick = forestDone(getProgress()) && !seaDone(getProgress()) ? "map-pick-sea" : "map-pick";
    for (let i = 0; i < lines.length; i++) if (lines[i] === "map-pick") lines[i] = pick;
    greeting.done = true;
    greeting.afterIntro = false;
    const t = window.setTimeout(() => void say(lines), 350);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Scene
      bg="bg-map"
      className="map-screen"
      boxed={
        <>
          {WORLDS.map((w) => {
            const isOpen = playable(w.id);
            return (
              <button
                key={w.id}
                type="button"
                className={`world world-${w.id} ${isOpen ? "is-open" : "is-locked"} ${shake === w.id ? "is-shaking" : ""}`}
                style={{ left: `${w.x}%`, top: `${w.y}%` }}
                onClick={() => {
                  if (isOpen) {
                    void sfx("step");
                    void navigate({ to: w.id === "sea" ? "/sea" : "/forest" });
                    return;
                  }
                  void sfx("tap");
                  setShake(w.id);
                  window.setTimeout(() => setShake(null), 600);
                  void say([forestDone(p) ? "locked-soon" : "locked"]);
                }}
              >
                <span className="world-sign">
                  {w.name}
                  {isOpen ? (
                    <small>
                      <IconStar /> {starsIn(p, WORLD[w.id as WorldId].stops)}/
                      {WORLD[w.id as WorldId].stops.length}
                    </small>
                  ) : (
                    <small className="lock" aria-label="закрыто">
                      <IconLock />
                    </small>
                  )}
                </span>
              </button>
            );
          })}
          <Fox pose="point" className="map-fox" />
        </>
      }
    >
      <div className="top-bar">
        <button
          type="button"
          className="round-btn album-btn"
          aria-label="Альбом"
          onClick={() => {
            void sfx("tap");
            void navigate({ to: "/album" });
          }}
        >
          <Pic name="chest" />
        </button>
        <StarCount n={stars} total={total} />
        <ParentsButton />
      </div>
    </Scene>
  );
}
