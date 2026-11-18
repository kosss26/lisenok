# Звуки, голос и музыка

## Музыка

Три трека, каждый для своего экрана (`tools/make-music.py`: моно 64 кбит/с, плавное начало и конец,
выравнивание громкости; исходники кладутся в `assets/music-src/`, в репозиторий не входят):

- `public/music/map.mp3` — карта и лесная тропинка: "Carefree" Kevin MacLeod (incompetech.com),
  первые 100 с — https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3
- `public/music/tasks.mp3` — задания: "Easy Lemon" Kevin MacLeod (incompetech.com), первые 120 с —
  https://incompetech.com/music/royalty-free/mp3-royaltyfree/Easy%20Lemon.mp3
- `public/music/celebrate.mp3` — награды: "Fluffing a Duck" Kevin MacLeod (incompetech.com),
  первые 45 с — https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3

Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/

## Звуки леса

`public/music/forest.mp3` — 40-секундная бесшовная петля, сведённая `tools/make-music.py`
из самых ровных отрывков трёх записей (CC0, указываем авторов из благодарности):

- ручей и ветер — "Park ambiences" (park_ambience_river.wav, park_ambience_wind.wav), Thimras,
  OpenGameArt, CC0 — https://opengameart.org/content/park-ambiences
- птицы — "Ambient Bird Sounds" (birds-isaiah658.ogg), isaiah658, OpenGameArt, CC0 —
  https://opengameart.org/content/ambient-bird-sounds

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
