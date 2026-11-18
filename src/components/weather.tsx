/** Light and weather over a picture: a tint for the time of day, a shower or drifting mist. */
import type { CSSProperties } from "react";
import type { TimeOfDay, Weather as Wx } from "../content/forest";

const DROPS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37) % 100,
  d: ((i * 0.29) % 1.2).toFixed(2),
  t: (0.7 + ((i * 7) % 5) * 0.08).toFixed(2),
}));

type Props = { className?: string; style?: CSSProperties };
export function Rain({ className = "", style }: Props) {
  return (
    <div className={`rain ${className}`} style={style} aria-hidden>
      {DROPS.map((p, i) => (
        <span
          key={i}
          className="drop"
          style={{ left: `${p.x}%`, animationDelay: `-${p.d}s`, animationDuration: `${p.t}s` }}
        />
      ))}
    </div>
  );
}

export function Mist({ className = "", style }: Props) {
  return (
    <div className={`mist ${className}`} style={style} aria-hidden>
      <span className="mist-a" />
      <span className="mist-b" />
    </div>
  );
}

/** for a stop screen: the tint of its time of day and its weather */
export function StopWeather({ time, weather }: { time: TimeOfDay; weather: Wx }) {
  return (
    <div
      className={`stop-weather tod-${time} wx-${weather}`}
      data-time={time}
      data-weather={weather}
    >
      <span className="tod-tint" aria-hidden />
      {weather === "rain" && <Rain />}
      {weather === "fog" && <Mist />}
    </div>
  );
}
