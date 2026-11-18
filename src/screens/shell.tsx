import { useEffect } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import {
  pauseAudio,
  resumeAudio,
  say,
  setVolumes,
  startMusic,
  unlockAudio,
  warmSfx,
} from "../game/audio";
import { addPlayTime, addTenMinutes, timeIsUp, useProgress } from "../game/progress";
import { Parents } from "../components/parents";
import { useParentsOpen } from "../components/parents-state";
import { Fox, HoldButton } from "../components/kit";

/** Root layout: sound unlock on the first tap, pause in the background, play time and rest screen. */
export function Shell() {
  const p = useProgress();
  const parentsOpen = useParentsOpen();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const resting = timeIsUp(p) && !parentsOpen;

  useEffect(() => setVolumes(p.settings.volume), [p.settings.volume]);

  useEffect(() => {
    const first = () => {
      unlockAudio();
      warmSfx();
      if (window.location.pathname !== "/") startMusic();
    };
    window.addEventListener("pointerdown", first, { once: true });
    const vis = () => (document.hidden ? pauseAudio() : resumeAudio());
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", first);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // count play time (not on the title screen and not while resting)
  useEffect(() => {
    if (path === "/" || resting) return;
    const id = window.setInterval(() => {
      if (!document.hidden) addPlayTime(5);
    }, 5000);
    return () => window.clearInterval(id);
  }, [path, resting]);

  useEffect(() => {
    if (resting) void say(["rest"]);
  }, [resting]);

  return (
    <div className="app">
      <Outlet />
      {resting && (
        <div className="rest" role="dialog" aria-label="Пора отдохнуть">
          <div className="rest-moon" />
          <Fox pose="read" className="rest-fox" />
          <h2>Лисёнок отдыхает</h2>
          <p>На сегодня игра закончилась. Поиграем завтра!</p>
          <HoldButton
            label="Ещё 10 минут (для взрослых)"
            className="rest-more"
            onDone={addTenMinutes}
          >
            <span>+10 минут</span>
            <small>для взрослых: удерживайте</small>
          </HoldButton>
        </div>
      )}
      {parentsOpen && <Parents />}
    </div>
  );
}
