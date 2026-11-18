/** One set of hand-drawn-style line icons (same stroke, rounded caps) instead of emoji. */
type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconBulb = ({ className }: P) => (
  <svg {...base} className={`icon icon-bulb ${className ?? ""}`}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 00-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0012 3z" className="fill" />
  </svg>
);
export const IconGear = ({ className }: P) => (
  <svg {...base} className={`icon icon-gear ${className ?? ""}`}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </svg>
);
export const IconLock = ({ className }: P) => (
  <svg {...base} className={`icon icon-lock ${className ?? ""}`}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" className="fill" />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" />
  </svg>
);
export const IconClose = ({ className }: P) => (
  <svg {...base} className={`icon icon-close ${className ?? ""}`}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconStar = ({ className }: P) => (
  <svg {...base} className={`icon icon-star ${className ?? ""}`}>
    <path
      d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"
      className="fill"
    />
  </svg>
);
export const IconBack = ({ className }: P) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
