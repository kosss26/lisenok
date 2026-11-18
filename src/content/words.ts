/** Picture words. `pic` is a file in public/art (webp). Syllables use "-" between parts. */
export type Word = {
  id: string;
  word: string; // UPPER CASE, with Ё
  syl: string; // syllables, e.g. "ЛИ-СА"
  pic: string;
  /** spoken form for TTS when it differs (stress with +) */
  say?: string;
  /** genitive plural for "Сколько …?" */
  many?: string;
};

export const WORDS: Word[] = [
  // 3 letters
  { id: "dom", word: "ДОМ", syl: "ДОМ", pic: "house" },
  { id: "syr", word: "СЫР", syl: "СЫР", pic: "cheese" },
  { id: "mak", word: "МАК", syl: "МАК", pic: "poppy" },
  { id: "luk", word: "ЛУК", syl: "ЛУК", pic: "onion" },
  { id: "dub", word: "ДУБ", syl: "ДУБ", pic: "oak" },
  { id: "zhuk", word: "ЖУК", syl: "ЖУК", pic: "beetle" },
  { id: "myod", word: "МЁД", syl: "МЁД", pic: "honey" },
  // 4–5 letters
  { id: "grib", word: "ГРИБ", syl: "ГРИБ", pic: "mushroom", many: "грибов" },
  { id: "list", word: "ЛИСТ", syl: "ЛИСТ", pic: "leaf", many: "листиков" },
  { id: "ryba", word: "РЫБА", syl: "РЫ-БА", pic: "fish", say: "р+ыба" },
  { id: "luna", word: "ЛУНА", syl: "ЛУ-НА", pic: "moon", say: "лун+а" },
  { id: "sova", word: "СОВА", syl: "СО-ВА", pic: "owl", say: "сов+а" },
  { id: "lisa", word: "ЛИСА", syl: "ЛИ-СА", pic: "fox-wave", say: "лис+а" },
  { id: "bobr", word: "БОБР", syl: "БОБР", pic: "beaver" },
  { id: "zayats", word: "ЗАЯЦ", syl: "ЗА-ЯЦ", pic: "hare", say: "з+аяц" },
  { id: "yozhik", word: "ЁЖИК", syl: "Ё-ЖИК", pic: "hedgehog", say: "ёжик" },
  { id: "belka", word: "БЕЛКА", syl: "БЕЛ-КА", pic: "squirrel", say: "б+елка" },
  { id: "myshka", word: "МЫШКА", syl: "МЫШ-КА", pic: "mouse", say: "м+ышка" },
  { id: "shishka", word: "ШИШКА", syl: "ШИШ-КА", pic: "cone", say: "ш+ишка", many: "шишек" },
  // 6+ letters
  { id: "yabloko", word: "ЯБЛОКО", syl: "ЯБ-ЛО-КО", pic: "apple", say: "+яблоко", many: "яблок" },
  {
    id: "malina",
    word: "МАЛИНА",
    syl: "МА-ЛИ-НА",
    pic: "raspberry",
    say: "мал+ина",
    many: "ягодок",
  },
  { id: "morkov", word: "МОРКОВЬ", syl: "МОР-КОВЬ", pic: "carrot", say: "морк+овь" },
  { id: "romashka", word: "РОМАШКА", syl: "РО-МАШ-КА", pic: "daisy", say: "ром+ашка" },
  {
    id: "zemlyanika",
    word: "ЗЕМЛЯНИКА",
    syl: "ЗЕМ-ЛЯ-НИ-КА",
    pic: "strawberry",
    say: "землян+ика",
  },
  { id: "barsuk", word: "БАРСУК", syl: "БАР-СУК", pic: "badger", say: "барс+ук" },
  { id: "lyagushka", word: "ЛЯГУШКА", syl: "ЛЯ-ГУШ-КА", pic: "frog", say: "лягушка" },
  { id: "zholud", word: "ЖЁЛУДЬ", syl: "ЖЁ-ЛУДЬ", pic: "acorn", say: "жёлудь", many: "желудей" },
  { id: "zvezda", word: "ЗВЕЗДА", syl: "ЗВЕЗ-ДА", pic: "star", say: "звезд+а" },
];

export const wordById = (id: string) => {
  const w = WORDS.find((x) => x.id === id);
  if (!w) throw new Error(`no word ${id}`);
  return w;
};

export const WORDS_BY_LEVEL: Record<1 | 2 | 3, string[]> = {
  1: ["dom", "syr", "mak", "luk", "dub", "zhuk", "myod"],
  2: [
    "grib",
    "list",
    "ryba",
    "luna",
    "sova",
    "lisa",
    "bobr",
    "zayats",
    "belka",
    "myshka",
    "shishka",
  ],
  3: [
    "yabloko",
    "malina",
    "morkov",
    "romashka",
    "zemlyanika",
    "barsuk",
    "lyagushka",
    "zholud",
    "zvezda",
  ],
};

/** Letters with their spoken names (for "Найди букву …"). */
export const LETTER_NAMES: Record<string, string> = {
  А: "а",
  Б: "бэ",
  В: "вэ",
  Г: "гэ",
  Д: "дэ",
  Е: "е",
  Ё: "ё",
  Ж: "жэ",
  З: "зэ",
  И: "и",
  Й: "и краткое",
  К: "ка",
  Л: "эль",
  М: "эм",
  Н: "эн",
  О: "о",
  П: "пэ",
  Р: "эр",
  С: "эс",
  Т: "тэ",
  У: "у",
  Ф: "эф",
  Х: "ха",
  Ц: "цэ",
  Ч: "чэ",
  Ш: "ша",
  Щ: "ща",
  Ы: "ы",
  Э: "э",
  Ю: "ю",
  Я: "я",
};
export const EASY_LETTERS = ["А", "О", "У", "И", "Ы", "Э", "М", "С", "Л", "Н", "Д", "К"];

/** Open syllables for "hear and find the syllable" (level 1). */
export const SYLLABLES = [
  "МА",
  "МО",
  "МУ",
  "ЛА",
  "ЛИ",
  "ЛУ",
  "СА",
  "СО",
  "СЫ",
  "НА",
  "НО",
  "РЫ",
  "БА",
  "КА",
  "ДО",
  "ДУ",
];

/** Short sentences: read and pick the picture. */
export const SENTENCES: {
  id: string;
  text: string;
  answer: string;
  options: string[];
  level: 2 | 3;
}[] = [
  { id: "s1", text: "Это гриб.", answer: "mushroom", options: ["moon", "fish"], level: 2 },
  { id: "s2", text: "Это луна.", answer: "moon", options: ["house", "cheese"], level: 2 },
  { id: "s3", text: "Тут дом.", answer: "house", options: ["oak", "poppy"], level: 2 },
  { id: "s4", text: "Это рыба.", answer: "fish", options: ["beetle", "carrot"], level: 2 },
  { id: "s5", text: "У мышки сыр.", answer: "mouse", options: ["bear", "hedgehog"], level: 2 },
  {
    id: "s6",
    text: "У ёжика яблоко.",
    answer: "hedgehog",
    options: ["squirrel", "mouse"],
    level: 2,
  },
  { id: "s7", text: "У мишки мёд.", answer: "bear", options: ["beaver", "frog"], level: 2 },
  { id: "s8", text: "У белки шишка.", answer: "squirrel", options: ["hare", "owl"], level: 2 },
  {
    id: "s9",
    text: "Сова носит очки. Кто носит очки?",
    answer: "owl",
    options: ["badger", "hare", "bear"],
    level: 3,
  },
  {
    id: "s10",
    text: "Бобр грызёт ветку. Кто грызёт ветку?",
    answer: "beaver",
    options: ["squirrel", "mouse", "frog"],
    level: 3,
  },
  {
    id: "s11",
    text: "Лягушка держит цветок. Кто держит цветок?",
    answer: "frog",
    options: ["hedgehog", "owl", "badger"],
    level: 3,
  },
  {
    id: "s12",
    text: "Белка спрятала шишку в дупло. Что спрятала белка?",
    answer: "cone",
    options: ["acorn", "apple", "mushroom"],
    level: 3,
  },
  {
    id: "s13",
    text: "Медвежонок любит сладкий мёд. Что любит медвежонок?",
    answer: "honey",
    options: ["cheese", "raspberry", "fish"],
    level: 3,
  },
  {
    id: "s14",
    text: "Зайчик грызёт морковку. Что грызёт зайчик?",
    answer: "carrot",
    options: ["onion", "daisy", "leaf"],
    level: 3,
  },
  {
    id: "s15",
    text: "Ночью на небе светит луна. Что светит ночью?",
    answer: "moon",
    options: ["star", "apple", "house"],
    level: 3,
  },
  {
    id: "s16",
    text: "Ёжик нашёл под ёлкой гриб. Что нашёл ёжик?",
    answer: "mushroom",
    options: ["cone", "strawberry", "beetle"],
    level: 3,
  },
  {
    id: "s17",
    text: "Мышка живёт в маленьком домике. Где живёт мышка?",
    answer: "house",
    options: ["oak", "honey", "poppy"],
    level: 3,
  },
];
