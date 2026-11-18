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

export type Stop = {
  id: string;
  resident: string; // picture in public/art
  name: string; // «Ёжик»
  skill: Skill;
  gift: string; // treasure picture
  giftName: string;
  /** greeting and thanks, spoken */
  hello: string;
  thanks: string;
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
    hello: "Привет! Я ёжик. Ветер перепутал мои буквы. Поможешь их найти?",
    thanks: "Спасибо, дружок! Держи звёздочку и золотой жёлудь!",
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
    hello: "Привет! Я белка. Я собираю запасы на зиму. Помоги мне посчитать!",
    thanks: "Ура, всё посчитали! Вот тебе звёздочка и синее пёрышко!",
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
    hello: "Привет! Я зайчик. Буквы из моих слов разбежались. Давай соберём их!",
    thanks: "Как здорово! Возьми звёздочку и клевер на удачу!",
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
    hello: "Здравствуй! Я сова. Я пишу слова, а ты найди к ним картинки.",
    thanks: "Ты прекрасно читаешь! Вот звёздочка и светлячок в баночке.",
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
    hello: "Привет! Я медвежонок. Я считаю горшочки с мёдом. Поможешь сложить?",
    thanks: "Вот это да! Держи звёздочку и гроздь рябины!",
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
    hello: "Привет! Я бобр. Я строю слова из слогов, как плотину из веточек. Поможешь?",
    thanks: "Отличная работа! Вот звёздочка и деревянная свистулька.",
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
    hello: "Привет! Я барсук. Я угощаю друзей яблоками. Помоги понять, сколько осталось!",
    thanks: "Спасибо! Возьми звёздочку и ракушку улитки.",
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
    hello: "Привет! Я мышка. Помоги мне сравнить, где больше, а где меньше.",
    thanks: "Пи-пи, спасибо! Вот звёздочка и полосатый камешек.",
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
    hello: "Ква! Я лягушонок. Прочитай мои записки и найди ответ!",
    thanks: "Ква-ква, ура! Это последняя звёздочка леса! И кленовый листок на память.",
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
