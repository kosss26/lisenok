/** Parents' corner (opened by holding the ⚙ button): child, progress, time limit, sound. */
import { useEffect, useState } from "react";
import { FOREST, SKILL_NAMES, type Skill } from "../content/forest";
import { NAMES } from "../content/names";
import { say } from "../game/audio";
import {
  LEVEL_NAMES,
  resetProgress,
  setSettings,
  starsIn,
  today,
  useProgress,
  weakSkills,
} from "../game/progress";
import type { Level } from "../game/tasks";
import { HoldButton } from "./kit";
import { closeParents } from "./parents-state";

const TABS = ["Ребёнок", "Успехи", "Время", "Звук"] as const;
type Tab = (typeof TABS)[number];
const LIMITS = [0, 10, 15, 20, 30];

function useOfflineStatus() {
  const [status, setStatus] = useState<{ have: number; total: number } | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "offline-status") setStatus({ have: e.data.have, total: e.data.total });
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    void navigator.serviceWorker.getRegistration().then((r) => r?.active?.postMessage("status"));
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);
  return status;
}

export function Parents() {
  const p = useProgress();
  const s = p.settings;
  const [tab, setTab] = useState<Tab>("Ребёнок");
  const offline = useOfflineStatus();
  const played = Math.round((p.playLog[today()] ?? 0) / 60);
  const weak = weakSkills(p);

  return (
    <div className="parents" role="dialog" aria-label="Для взрослых">
      <div className="parents-head">
        <h2>Для взрослых</h2>
        <button type="button" className="parents-close" aria-label="Закрыть" onClick={closeParents}>
          ✕
        </button>
      </div>
      <div className="parents-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`parents-tab ${tab === t ? "is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="parents-body">
        {tab === "Ребёнок" && (
          <>
            <label className="field">
              <span>Имя ребёнка (лисёнок будет обращаться по имени)</span>
              <select
                value={s.name ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSettings({ name: id });
                  if (id) void say([`name-${id}-bravo`]);
                }}
              >
                <option value="">Без имени</option>
                {NAMES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Уровень заданий</span>
              <div className="levels">
                {([1, 2, 3] as Level[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`level-card ${s.level === l ? "is-active" : ""}`}
                    onClick={() => setSettings({ level: l })}
                  >
                    {LEVEL_NAMES[l]}
                  </button>
                ))}
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={s.auto}
                onChange={(e) => setSettings({ auto: e.target.checked })}
              />
              <span>
                Подстраивать уровень автоматически
                <small>
                  Две остановки без ошибок — задания сложнее, две трудные подряд — проще.
                </small>
              </span>
            </label>
          </>
        )}

        {tab === "Успехи" && (
          <>
            <div className="stats-row">
              <div className="stat">
                <b>
                  {starsIn(p)}/{FOREST.length}
                </b>
                <span>звёзд в лесу</span>
              </div>
              <div className="stat">
                <b>{played} мин</b>
                <span>сегодня</span>
              </div>
              <div className="stat">
                <b>{s.level}</b>
                <span>уровень</span>
              </div>
            </div>
            <h3>Навыки (с первой попытки)</h3>
            <ul className="skills">
              {(Object.keys(SKILL_NAMES) as Skill[]).map((k) => {
                const st = p.skills[k];
                const pct = st && st.tasks ? Math.round((st.firstTry / st.tasks) * 100) : null;
                return (
                  <li key={k} className={weak.includes(k) ? "is-weak" : ""}>
                    <span className="skill-name">{SKILL_NAMES[k]}</span>
                    <span className="skill-bar">
                      <i style={{ width: `${pct ?? 0}%` }} />
                    </span>
                    <span className="skill-pct">{pct === null ? "—" : `${pct}%`}</span>
                  </li>
                );
              })}
            </ul>
            <p className="weak-note">
              {weak.length
                ? `Стоит потренировать: ${weak.map((k) => SKILL_NAMES[k].toLowerCase()).join(", ")}.`
                : "Пока всё идёт хорошо. Трудные навыки появятся здесь, когда наберётся хотя бы 3 задания."}
            </p>
          </>
        )}

        {tab === "Время" && (
          <>
            <div className="field">
              <span>Сколько можно играть в день</span>
              <div className="limits">
                {LIMITS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`limit ${s.limit === m ? "is-active" : ""}`}
                    onClick={() => setSettings({ limit: m })}
                  >
                    {m === 0 ? "Без ограничений" : `${m} мин`}
                  </button>
                ))}
              </div>
            </div>
            <p className="hint-text">
              Сегодня сыграно: {played} мин. Когда время выйдет, лисёнок ляжет отдыхать; взрослый
              может добавить 10 минут, удерживая кнопку.
            </p>
          </>
        )}

        {tab === "Звук" && (
          <>
            {(
              [
                ["voice", "Голос"],
                ["sounds", "Звуки"],
                ["music", "Музыка"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="field range">
                <span>{label}</span>
                <input
                  id={`vol-${label}`}
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={s.volume[key]}
                  onChange={(e) =>
                    setSettings({ volume: { ...s.volume, [key]: Number(e.target.value) } })
                  }
                />
              </label>
            ))}
          </>
        )}
      </div>

      <div className="parents-foot">
        <p className="offline-note">
          {offline
            ? offline.have >= offline.total
              ? "✓ Игра сохранена на устройстве и работает без интернета."
              : `Сохраняем игру для работы без интернета: ${offline.have} из ${offline.total}…`
            : "Без интернета игра заработает после первого полного запуска."}
        </p>
        <HoldButton
          label="Сбросить прогресс: удерживайте"
          className="reset-btn"
          onDone={resetProgress}
        >
          <span>Сбросить прогресс (удерживать)</span>
        </HoldButton>
      </div>
    </div>
  );
}
