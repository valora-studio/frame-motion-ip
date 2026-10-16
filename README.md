# Сайт Frame & Motion

Сайт для заказчиков монтажа: услуги, цены, как работаем, стандарт ролика,
контакты, оферта, оплата и возврат, политика ПДн. Состав страниц — как
у сайта Valora (`Valora/site/`), под подключение ЮKassa: цены, ФИО и ИНН,
контакты, оферта, условия возврата.

Живой адрес: https://valora-studio.github.io/frame-motion-ip/
(репо `valora-studio/frame-motion-ip`, Pages из `main`).

Оформление — бренд Frame & Motion (`../brand/brand.html`): фон `#0B0B0E`,
янтарь `#FFB020`, Manrope. Шрифты лежат локально в `fonts/`.

## Сборка

Страницы генерируются, руками `*.html` не править — перезапишутся.

```bash
PYTHONIOENCODING=utf-8 python build.py          # → 9 страниц рядом
PYTHONIOENCODING=utf-8 python make_img.py       # фавиконки и img/og.jpg
PYTHONIOENCODING=utf-8 python shot.py           # рендеры 1440 в out/
PYTHONIOENCODING=utf-8 python shot.py 500       # рендеры под телефон
```

- Контакты и реквизиты — `SITE` в начале `build.py`.
- Цены — `PRICE_ROWS`; они же попадают в оферту (п. 3.2).
- Чек-лист «Стандарта» — `CHECKS`, совпадает с уроком 5 курса для монтажёров.
- Ролик на главной — `CAPS` (фразы субтитров), сцена «сырьё → ролик» — `RAW`.

`shot.py` снимает в reduced-motion (конечные состояния сцен). Живую анимацию
смотреть через `python -m http.server` + браузер.

Публикация: `git commit` → `git push` — Pages пересоберётся за ~30 с.
