import { useEffect } from "react";
import { FOREST } from "../content/forest";
import { BackButton, Pic } from "../components/kit";
import { IconLock } from "../components/icons";
import { say, sfx } from "../game/audio";
import { useProgress } from "../game/progress";

export function Album() {
  const p = useProgress();
  useEffect(() => {
    const t = window.setTimeout(() => void say(["album"]), 300);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="album-screen">
      <div className="top-bar">
        <BackButton to="/map" label="На карту" />
        <h1 className="album-title">Мои сокровища</h1>
        <span className="top-spacer" />
      </div>
      <p className="album-sub">
        Лес · {p.gifts.length} из {FOREST.length}
      </p>
      <div className="album-grid">
        {FOREST.map((s) => {
          const have = p.gifts.includes(s.gift);
          return (
            <button
              key={s.id}
              type="button"
              className={`album-slot ${have ? "is-have" : "is-empty"}`}
              aria-label={have ? s.giftName : "Пока не найдено"}
              onClick={() => void sfx(have ? "pick" : "tap")}
            >
              <Pic name={s.gift} className="album-pic" />
              <span className="album-name">{have ? s.giftName : "?"}</span>
              <Pic name={s.resident} className="album-from" />
            </button>
          );
        })}
      </div>
      <div className="album-locked">
        {["Море", "Горы", "Город", "Космос"].map((w) => (
          <span key={w}>
            <IconLock /> {w}
          </span>
        ))}
      </div>
    </div>
  );
}
