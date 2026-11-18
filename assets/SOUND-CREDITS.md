# Звуки, голос и музыка

## Музыка

"Easy Lemon" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
(первые 120 с, моно, плавное начало и конец для зацикливания — `tools/make-sfx.py`;
исходник: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Easy%20Lemon.mp3,
кладётся в `assets/music-src/easy-lemon.mp3`, в репозиторий не входит)

## Звуковые эффекты

Все эффекты (`public/sfx/*.mp3`: тап, выбор, «правильно», «попробуй ещё», звёздочка, фанфары, шаг)
синтезированы скриптом `tools/make-sfx.py` — собственная работа, без чужих записей.

## Голос

Все фразы синтезированы Silero TTS v5 (ru) скриптом `tools/make-voice.py`: лисёнок и рассказчик — голос xenia, жители леса — голоса aidar, baya, kseniya и eugene со сдвигом высоты тона (`assets/voice-speakers.json`).
Звуки-гласные (а, о, у, ы, э, и) вырезаются из нескольких медленных вариантов по формантам (Praat),
чтобы звучал чистый ровный звук; ударения во фразах — словарь `src/content/stress.ts`.
Модели Silero распространяются по лицензии CC BY-NC 4.0 — подходит для личного некоммерческого
использования. Для коммерческой версии голос нужно перезаписать (живой диктор или коммерческий TTS).

## Картинки

Иллюстрации сгенерированы нейросетью для этого проекта (листы в `assets/sheets`,
нарезка `tools/cut-sheet.py`; листы слов `w01–w25.jpg`, имена картинок — `assets/word-sheets.json`).
