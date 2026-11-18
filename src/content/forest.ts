/** The world map and world 1 — the forest. */
export type Skill =
  "letters" | "count" | "build" | "read" | "add" | "syllables" | "sub" | "compare" | "sentence";

export const SKILL_NAMES: Record<Skill, string> = {
  letters: "Буквы и звуки",
  count: "Счёт",
  build: "Собрать слово",
  read: "Чтение слов",
  add: "Сложение",
  syllables: "Слоги",
  sub: "Вычитание",
  compare: "Больше и меньше",
  sentence: "Чтение предложений",
};

/** One spoken line of a dialogue. The pose picks the picture: resident "" | "sad" | "happy", fox pose name. */
export type Line =
  | { who: "res"; pose: "" | "sad" | "happy"; text: string }
  | { who: "fox"; pose: "wave" | "point" | "think" | "read" | "cheer" | "jump"; text: string };

export type Stop = {
  id: string;
  resident: string; // picture in public/art
  name: string; // «Ёжик»
  skill: Skill;
  gift: string; // treasure picture
  giftName: string;
  /** the resident's own voice: Silero speaker and pitch shift */
  voice: { speaker: "aidar" | "baya" | "kseniya" | "eugene"; pitch: number };
  /** voiced dialogue before the tasks and after the star */
  intro: Line[];
  outro: Line[];
  /** position of the clearing on the forest picture, % */
  x: number;
  y: number;
};

export const FOREST: Stop[] = [
  {
    id: "hedgehog",
    resident: "hedgehog",
    name: "Ёжик",
    skill: "letters",
    gift: "t-acorn",
    giftName: "Золотой жёлудь",
    voice: { speaker: "baya", pitch: 1.08 },
    intro: [
      { who: "res", pose: "sad", text: "Ой-ой! Привет! Я ёжик. Ветер перепутал все мои буквы!" },
      { who: "fox", pose: "wave", text: "Не грусти, ёжик! Мы с другом тебе поможем." },
      { who: "res", pose: "", text: "Правда? Тогда найди букву, которую я назову!" },
    ],
    outro: [
      { who: "res", pose: "happy", text: "Спасибо, дружок! Держи звёздочку и золотой жёлудь!" },
      { who: "fox", pose: "cheer", text: "Ура! Идём дальше по тропинке!" },
    ],
    x: 71.5,
    y: 79,
  },
  {
    id: "squirrel",
    resident: "squirrel",
    name: "Белка",
    skill: "count",
    gift: "t-feather",
    giftName: "Синее пёрышко",
    voice: { speaker: "kseniya", pitch: 1.1 },
    intro: [
      { who: "res", pose: "sad", text: "Ах, привет! Я белка. Зима скоро, а я сбилась со счёта!" },
      { who: "fox", pose: "point", text: "Давай считать вместе! Мой друг отлично считает." },
      { who: "res", pose: "", text: "Сколько у меня запасов? Посчитай, пожалуйста!" },
    ],
    outro: [
      {
        who: "res",
        pose: "happy",
        text: "Ура, всё посчитали! Вот тебе звёздочка и синее пёрышко!",
      },
      { who: "fox", pose: "cheer", text: "Теперь белочке хватит запасов на всю зиму!" },
    ],
    x: 30,
    y: 73.5,
  },
  {
    id: "hare",
    resident: "hare",
    name: "Зайчик",
    skill: "build",
    gift: "t-clover",
    giftName: "Клевер на удачу",
    voice: { speaker: "baya", pitch: 1.16 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Привет! Я зайчик. Буквы из моих слов разбежались по полянке!",
      },
      { who: "fox", pose: "think", text: "Ничего, мы их поймаем и поставим по порядку." },
      { who: "res", pose: "", text: "Нажимай на буквы, чтобы собрать слово!" },
    ],
    outro: [
      { who: "res", pose: "happy", text: "Как здорово! Возьми звёздочку и клевер на удачу!" },
      { who: "fox", pose: "cheer", text: "Все буквы на месте. Здорово получилось!" },
    ],
    x: 63,
    y: 60,
  },
  {
    id: "owl",
    resident: "owl",
    name: "Сова",
    skill: "read",
    gift: "t-firefly",
    giftName: "Светлячок в баночке",
    voice: { speaker: "kseniya", pitch: 0.94 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Здравствуй! Я сова. Мои слова и картинки потеряли друг друга.",
      },
      {
        who: "fox",
        pose: "read",
        text: "Мой друг умеет читать. Он найдёт каждому слову картинку!",
      },
      { who: "res", pose: "", text: "Прочитай слово и выбери подходящую картинку." },
    ],
    outro: [
      {
        who: "res",
        pose: "happy",
        text: "Ты прекрасно читаешь! Вот звёздочка и светлячок в баночке.",
      },
      { who: "fox", pose: "cheer", text: "Сова говорит, что ты настоящий читатель!" },
    ],
    x: 32.5,
    y: 55.5,
  },
  {
    id: "bear",
    resident: "bear",
    name: "Медвежонок",
    skill: "add",
    gift: "t-rowan",
    giftName: "Гроздь рябины",
    voice: { speaker: "aidar", pitch: 1.0 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Привет! Я медвежонок. Мне принесли ещё мёда, а сколько стало горшочков?",
      },
      { who: "fox", pose: "point", text: "Это легко! Надо просто сложить." },
      { who: "res", pose: "", text: "Помоги мне сложить горшочки!" },
    ],
    outro: [
      { who: "res", pose: "happy", text: "Вот это да! Держи звёздочку и гроздь рябины!" },
      { who: "fox", pose: "cheer", text: "Мишка будет пить чай с мёдом. Идём дальше!" },
    ],
    x: 66,
    y: 36.5,
  },
  {
    id: "beaver",
    resident: "beaver",
    name: "Бобр",
    skill: "syllables",
    gift: "t-whistle",
    giftName: "Деревянная свистулька",
    voice: { speaker: "eugene", pitch: 1.03 },
    intro: [
      { who: "res", pose: "sad", text: "Привет! Я бобр. Моя плотина из слогов развалилась!" },
      { who: "fox", pose: "think", text: "Соберём её снова, слог за слогом." },
      { who: "res", pose: "", text: "Найди нужный слог, и плотина станет крепкой!" },
    ],
    outro: [
      {
        who: "res",
        pose: "happy",
        text: "Отличная работа! Вот звёздочка и деревянная свистулька.",
      },
      { who: "fox", pose: "cheer", text: "Какая крепкая плотина получилась!" },
    ],
    x: 43,
    y: 27.5,
  },
  {
    id: "badger",
    resident: "badger",
    name: "Барсук",
    skill: "sub",
    gift: "t-snail",
    giftName: "Ракушка улитки",
    voice: { speaker: "aidar", pitch: 0.94 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Привет! Я барсук. Я раздал друзьям яблоки и не знаю, сколько осталось.",
      },
      { who: "fox", pose: "point", text: "Чтобы узнать, сколько осталось, надо вычесть!" },
      { who: "res", pose: "", text: "Помоги мне посчитать, сколько яблок осталось!" },
    ],
    outro: [
      { who: "res", pose: "happy", text: "Спасибо! Возьми звёздочку и ракушку улитки." },
      { who: "fox", pose: "cheer", text: "Теперь барсук знает, сколько у него яблок." },
    ],
    x: 63,
    y: 20,
  },
  {
    id: "mouse",
    resident: "mouse",
    name: "Мышка",
    skill: "compare",
    gift: "t-pebble",
    giftName: "Полосатый камешек",
    voice: { speaker: "kseniya", pitch: 1.24 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Пи-пи! Привет! Я мышка. Никак не пойму, где больше, а где меньше.",
      },
      { who: "fox", pose: "think", text: "Давай сравним! Это совсем не трудно." },
      { who: "res", pose: "", text: "Покажи мне, где больше, а где меньше!" },
    ],
    outro: [
      { who: "res", pose: "happy", text: "Пи-пи, спасибо! Вот звёздочка и полосатый камешек." },
      { who: "fox", pose: "cheer", text: "Слышишь? Мышка пищит от радости!" },
    ],
    x: 47,
    y: 15.5,
  },
  {
    id: "frog",
    resident: "frog",
    name: "Лягушонок",
    skill: "sentence",
    gift: "t-maple",
    giftName: "Кленовый листок",
    voice: { speaker: "eugene", pitch: 1.1 },
    intro: [
      {
        who: "res",
        pose: "sad",
        text: "Ква! Я лягушонок. Мне прислали записки, а я ещё не умею читать!",
      },
      { who: "fox", pose: "read", text: "Мой друг прочитает тебе каждую записку." },
      { who: "res", pose: "", text: "Прочитай записку и найди ответ. Ква!" },
    ],
    outro: [
      {
        who: "res",
        pose: "happy",
        text: "Ква-ква, ура! Это последняя звёздочка леса! И кленовый листок на память.",
      },
      { who: "fox", pose: "cheer", text: "Это была последняя звёздочка! Лес снова сияет!" },
    ],
    x: 60,
    y: 10,
  },
];

export const WORLDS = [
  { id: "forest", name: "Лес", x: 50, y: 84, open: true },
  { id: "sea", name: "Море", x: 40, y: 61, open: false },
  { id: "mountains", name: "Горы", x: 50, y: 44, open: false },
  { id: "city", name: "Город", x: 52, y: 27, open: false },
  { id: "space", name: "Космос", x: 50, y: 13, open: false },
] as const;
