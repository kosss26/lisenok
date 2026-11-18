/**
 * Every spoken line of the game: key -> text for Silero (voice "xenia").
 * The clips live in public/voice/<key>.mp3. After changing this file:
 *   npm run voice:list && python3 tools/make-voice.py <v5_ru.pt> only-missing
 * ("+" before a vowel marks stress for the synthesizer.)
 */
import { FOREST } from "./forest.ts";
import { NAMES } from "./names.ts";
import { LETTER_NAMES, SENTENCES, SYLLABLES, WORDS } from "./words.ts";

const TR: Record<string, string> = {
  А: "a",
  Б: "b",
  В: "v",
  Г: "g",
  Д: "d",
  Е: "e",
  Ё: "yo",
  Ж: "zh",
  З: "z",
  И: "i",
  Й: "j",
  К: "k",
  Л: "l",
  М: "m",
  Н: "n",
  О: "o",
  П: "p",
  Р: "r",
  С: "s",
  Т: "t",
  У: "u",
  Ф: "f",
  Х: "h",
  Ц: "c",
  Ч: "ch",
  Ш: "sh",
  Щ: "sch",
  Ъ: "qq",
  Ы: "y",
  Ь: "q",
  Э: "eh",
  Ю: "yu",
  Я: "ya",
};
/** Latin file-safe id for Cyrillic text: "ЛИ" -> "li". */
export const translit = (s: string) =>
  [...s.toUpperCase()].map((c) => TR[c] ?? c.toLowerCase()).join("");

export const letterKey = (l: string) => `letter-${translit(l)}`;
export const sylKey = (s: string) => `syl-${translit(s)}`;
export const numKey = (n: number) => `n-${n}`;
export const wordKey = (id: string) => `w-${id}`;

const ONES = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = [
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
];
const TENS = [
  "",
  "",
  "двадцать",
  "тридцать",
  "сорок",
  "пятьдесят",
  "шестьдесят",
  "семьдесят",
  "восемьдесят",
  "девяносто",
];
export function numberWords(n: number): string {
  if (n === 100) return "сто";
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

export const PRAISE = 8;
export const AGAIN = 4;

const FIXED: Record<string, string> = {
  intro:
    "Однажды ночью с неба упали звёзды и рассыпались по всему свету. Лисёнок хочет вернуть их домой, на небо. Поможешь ему?",
  hi: "Привет! Я лисёнок. Отправимся в путь?",
  "map-pick": "Куда отправимся? Нажми на лес!",
  "map-forest": "Идём в лес! Лесные жители нашли звёздочки. Помоги им, и они отдадут звёзды.",
  locked: "Этот мир пока спит. Сначала собери все звёзды в лесу!",
  "locked-soon": "Этот мир скоро откроется. Лисёнок уже собирает рюкзак!",
  "forest-next": "Кому поможем? Нажми на жителя леса.",
  "stop-locked": "Сначала помоги тем, кто ближе к началу тропинки.",
  "forest-done":
    "Ура! Все звёзды леса собраны! Они снова сияют на небе. Скоро мы отправимся к морю!",
  album: "Это твой альбом сокровищ. Каждый житель леса дарит подарок.",
  rest: "Лисёнок устал и хочет отдохнуть. Поиграем потом!",
  "level-up": "Ты так здорово справляешься! Задания станут чуть интереснее.",
  "show-answer": "Смотри, вот правильный ответ.",
  "star-get": "Звёздочка твоя!",
  "praise-1": "Правильно!",
  "praise-2": "Молодец!",
  "praise-3": "Верно!",
  "praise-4": "Отлично!",
  "praise-5": "Здорово!",
  "praise-6": "Умница!",
  "praise-7": "Так держать!",
  "praise-8": "Ура, получилось!",
  "again-1": "Попробуй ещё!",
  "again-2": "Почти! Попробуй ещё раз.",
  "again-3": "Не спеши, подумай ещё.",
  "again-4": "Ничего страшного, давай ещё раз!",
  plus: "плюс",
  minus: "минус",
  more: "больше",
  less: "меньше",
  equal: "равно",
  // letters
  "q-letter-find": "Найди букву",
  "q-letter-first": "С какой буквы начинается слово",
  "q-letter-gap": "Какой буквы не хватает в слове",
  "h-letter": "Послушай ещё раз и найди эту букву:",
  "h-letter-first": "Скажи слово медленно. Какой звук ты слышишь первым?",
  "h-letter-gap": "Скажи слово медленно, по звукам. Какого звука не хватает?",
  // counting
  "q-count-1": "Сколько здесь? Нажимай на каждую картинку и считай!",
  "q-count-2": "Посчитай, сколько здесь. В каждом ряду по пять.",
  "q-count-3": "Сколько всего? В каждой полоске по десять. А потом досчитай по одной.",
  "h-count": "Нажимай на картинки по очереди, я буду считать вместе с тобой.",
  "h-count-3": "Считай полоски десятками: десять, двадцать, тридцать. А потом добавь остальные.",
  // build a word
  "q-build": "Собери слово. Нажимай на буквы по порядку.",
  "h-build": "Скажи слово медленно. Светится буква, которая идёт дальше.",
  // read
  "q-read": "Прочитай слово и найди картинку.",
  "h-read": "Здесь написано:",
  // add / subtract
  "q-add-story": "У медвежонка были горшочки с мёдом. Ему принесли ещё. Сколько стало?",
  "q-solve": "Реши пример:",
  "q-sub-story": "У барсука были яблоки. Он угостил друзей. Сколько осталось?",
  "h-add": "Посчитай все горшочки вместе.",
  "h-add-3": "Сначала сложи десятки, а потом единицы.",
  "h-sub": "Посчитай яблоки, которые остались.",
  "h-sub-3": "Сначала вычти десятки, а потом единицы.",
  // syllables
  "q-syl-find": "Найди слог",
  "q-syl-build": "Собери слово из слогов.",
  "h-syl": "Скажи слово медленно, по слогам, и хлопни в ладоши на каждый слог.",
  // compare
  "q-cmp-more": "Где больше? Нажми на эту корзинку.",
  "q-cmp-less": "Где меньше? Нажми на эту корзинку.",
  "h-cmp": "Посчитай, сколько в каждой корзинке.",
  "q-cmp-sign": "Какой знак поставить? Больше, меньше или равно?",
  "h-cmp-sign": "Открытый клювик знака всегда смотрит на большее число.",
  // sentences
  "q-word-find": "Найди слово",
  "q-sentence": "Прочитай и найди картинку.",
  "q-sentence-3": "Прочитай и ответь на вопрос.",
  "h-sentence": "Послушай:",
  "h-word-find": "Посмотри на первую букву.",
};

export function voiceLines(): Record<string, string> {
  const lines: Record<string, string> = { ...FIXED };
  // the synthesizer cannot say a lone "ё"
  const solo = (t: string) => (t === "ё" ? "йо" : t);
  for (const [letter, name] of Object.entries(LETTER_NAMES)) lines[letterKey(letter)] = solo(name);
  for (let n = 0; n <= 100; n++) lines[numKey(n)] = numberWords(n);
  for (const w of WORDS) lines[wordKey(w.id)] = w.say ?? w.word.toLowerCase();
  const syl = new Set<string>(SYLLABLES);
  for (const w of WORDS) for (const s of w.syl.split("-")) syl.add(s);
  for (const s of syl) lines[sylKey(s)] = solo(s.toLowerCase());
  for (const s of SENTENCES) lines[`sen-${s.id}`] = s.text;
  for (const stop of FOREST) {
    lines[`hello-${stop.id}`] = stop.hello;
    lines[`thanks-${stop.id}`] = stop.thanks;
  }
  for (const { id, name } of NAMES) {
    lines[`name-${id}-hi`] = `Привет, ${name}! Отправимся в путь?`;
    lines[`name-${id}-bravo`] = `Молодец, ${name}!`;
  }
  return lines;
}
