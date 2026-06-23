# ORDO ARCANUM — палитра

Тёмное фэнтези / grimdark-архив D&D. Эстетика: вулканический камень, окислённая
бронза, пергаментные чернила, геральдическое золото.

Фон приложения — `stone #14110f` · основной текст — `ink #cdc1a6` · ключевой акцент — `gold #b08d4e`.

## Поверхности (камень → пепел)

| Токен | Hex |
|---|---|
| void | `#050403` |
| abyss | `#0a0908` |
| stone | `#14110f` |
| panel | `#1c1816` |
| panel-raised | `#221d1a` |
| panel-edge | `#2a241f` |
| ash | `#2f2823` |
| ash-light | `#3a322c` |

## Бордеры (бронза / латунь)

| Токен | Значение |
|---|---|
| hairline | `rgba(122, 99, 64, 0.18)` |
| rule | `rgba(122, 99, 64, 0.32)` |
| rule-strong | `rgba(150, 122, 78, 0.55)` |
| bronze | `#5a4a35` |
| bronze-warm | `#6f5a3e` |
| brass | `#8e7448` |

## Чернила (текст по пергаменту)

| Токен | Hex |
|---|---|
| ink-bright | `#e6dcc4` |
| ink | `#cdc1a6` |
| ink-quiet | `#968c75` |
| ink-faint | `#6a614f` |
| ink-ghost | `#443c30` |

## Геральдические акценты

| Токен | Hex |
|---|---|
| gold | `#b08d4e` |
| gold-deep | `#836a3a` |
| gold-pale | `#d4b478` |
| ember (огонь / опасность) | `#b3461a` |
| ember-deep | `#7d2f10` |
| ember-pale | `#d8896a` |
| burgundy | `#6b2a2a` |
| burgundy-deep | `#401717` |
| arcane (магия) | `#5a8e94` |
| arcane-deep | `#2f5a60` |
| verdigris | `#4a6b53` |
| moss (позитив) | `#7a9866` |

## Редкость предметов

| Тир | Hex |
|---|---|
| common | `#968c75` |
| uncommon | `#7a9866` |
| rare | `#5a8e94` |
| very-rare | `#8f6fb5` |
| legendary | `#d4b478` |
| artifact | `#b3461a` |

## CSS-переменные (для копирования)

```css
:root {
  /* Поверхности */
  --void:          #050403;
  --abyss:         #0a0908;
  --stone:         #14110f;
  --panel:         #1c1816;
  --panel-raised:  #221d1a;
  --panel-edge:    #2a241f;
  --ash:           #2f2823;
  --ash-light:     #3a322c;

  /* Бордеры */
  --hairline:      rgba(122, 99, 64, 0.18);
  --rule:          rgba(122, 99, 64, 0.32);
  --rule-strong:   rgba(150, 122, 78, 0.55);
  --bronze:        #5a4a35;
  --bronze-warm:   #6f5a3e;
  --brass:         #8e7448;

  /* Чернила */
  --ink-bright:    #e6dcc4;
  --ink:           #cdc1a6;
  --ink-quiet:     #968c75;
  --ink-faint:     #6a614f;
  --ink-ghost:     #443c30;

  /* Акценты */
  --gold:          #b08d4e;
  --gold-deep:     #836a3a;
  --gold-pale:     #d4b478;
  --ember:         #b3461a;
  --ember-deep:    #7d2f10;
  --ember-pale:    #d8896a;
  --burgundy:      #6b2a2a;
  --burgundy-deep: #401717;
  --arcane:        #5a8e94;
  --arcane-deep:   #2f5a60;
  --verdigris:     #4a6b53;
  --moss:          #7a9866;

  /* Редкость */
  --rar-common:    #968c75;
  --rar-uncommon:  #7a9866;
  --rar-rare:      #5a8e94;
  --rar-very-rare: #8f6fb5;
  --rar-legendary: #d4b478;
  --rar-artifact:  #b3461a;
}
```
