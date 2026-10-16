# -*- coding: utf-8 -*-
"""Фавиконки и картинка для ссылок (og.jpg) → img/.

Рисуется в headless Edge из HTML ниже — тот же знак, что в brand/brand.html.

    PYTHONIOENCODING=utf-8 python make_img.py
"""
import os
import subprocess
import tempfile
import time

from PIL import Image

from shot import EDGE

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
FONTS = "fonts"   # страница-заготовка кладётся рядом с fonts/, иначе Edge не отдаёт шрифт

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0B0B0E"/>
  <g fill="none" stroke="#EDEDF0" stroke-width="5">
    <path d="M10 22V10h12M42 10h12v12M54 42v12H42M22 54H10V42"/>
  </g>
  <text x="32" y="44" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="34" fill="#FFB020">&amp;</text>
</svg>
"""

BASE_CSS = """
@font-face { font-family: 'Manrope'; font-weight: 400 800; src: url(%(f)s/Manrope-cyrillic.woff2) format('woff2');
  unicode-range: U+0400-045F; }
@font-face { font-family: 'Manrope'; font-weight: 400 800; src: url(%(f)s/Manrope-latin.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+2000-206F; }
* { margin: 0; box-sizing: border-box; }
html, body { background: #0B0B0E; color: #EDEDF0; font-family: Manrope, sans-serif; overflow: hidden; }
.mark { position: relative; width: var(--s); height: calc(var(--s) * 1.25); }
.mark i { position: absolute; width: 30%%; height: 24%%; border: 0 solid #EDEDF0; border-width: calc(var(--s) * .085); }
.mark i:nth-child(1) { left: 0; top: 0; border-right: 0; border-bottom: 0; }
.mark i:nth-child(2) { right: 0; top: 0; border-left: 0; border-bottom: 0; }
.mark i:nth-child(3) { left: 0; bottom: 0; border-right: 0; border-top: 0; }
.mark i:nth-child(4) { right: 0; bottom: 0; border-left: 0; border-top: 0; }
.mark b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #FFB020;
  font-weight: 800; font-size: calc(var(--s) * .78); line-height: 1; padding-bottom: calc(var(--s) * .06); }
""" % {"f": FONTS}

MARK = '<div class="mark"><i></i><i></i><i></i><i></i><b>&amp;</b></div>'

ICON = """<!doctype html><meta charset="utf-8"><style>%s
body { width: 512px; height: 512px; display: grid; place-items: center; }
</style><div class="mark" style="--s: 330px">%s</div>""" % (BASE_CSS, MARK[len('<div class="mark">'):])

OG = """<!doctype html><meta charset="utf-8"><style>%s
body { width: 1200px; height: 630px; position: relative; }
.head { position: absolute; left: 72px; top: 64px; display: flex; align-items: center; gap: 18px; }
.word { font-weight: 800; letter-spacing: .16em; font-size: 22px; }
.word span { color: #FFB020; }
h1 { position: absolute; left: 72px; top: 168px; width: 640px; font-size: 58px; line-height: 1.04; font-weight: 800; letter-spacing: -.02em; }
p { position: absolute; left: 72px; top: 452px; width: 600px; font-size: 26px; line-height: 1.4; color: #A3A3AD; font-weight: 500; }
p b { color: #FFB020; font-weight: 800; }
.phone { position: absolute; right: 120px; top: 56px; width: 290px; height: 516px; border: 10px solid #26262C; border-radius: 40px; overflow: hidden;
  background: linear-gradient(165deg, #2B3A55, #6B4E71 55%%, #C98B5A); }
.phone .h { position: absolute; left: 50%%; top: 27%%; width: 30%%; aspect-ratio: 1; transform: translateX(-50%%); border-radius: 50%%; background: rgba(12,12,18,.62); }
.phone .b { position: absolute; left: 50%%; bottom: -2%%; width: 60%%; height: 52%%; transform: translateX(-50%%); border-radius: 50%% 50%% 0 0 / 34%% 34%% 0 0; background: rgba(12,12,18,.62); }
.phone .c { position: absolute; left: 10%%; right: 10%%; top: 55%%; text-align: center; font-weight: 800; font-size: 25px; line-height: 1.15; color: #fff;
  text-shadow: 0 2px 0 #000, 0 0 10px rgba(0,0,0,.7); }
.phone .c em { font-style: normal; color: #FFD24A; }
.tl { position: absolute; right: 60px; width: 410px; top: 588px; height: 10px; display: flex; gap: 3px; }
.tl i { flex: 1; background: #4A3FB8; } .tl i:nth-child(2n) { background: #2F6D63; }
</style>
<div class="head"><div class="mark" style="--s: 40px"><i></i><i></i><i></i><i></i><b>&amp;</b></div>
<div class="word">FRAME <span>&amp;</span> MOTION</div></div>
<h1>Монтаж вертикальных роликов из ваших исходников</h1>
<p>Нарезка, субтитры, музыка и звук. Ролик за&nbsp;<b>2&nbsp;рабочих дня</b>, от&nbsp;<b>3&nbsp;000&nbsp;₽</b></p>
<div class="phone"><i class="h"></i><i class="b"></i><div class="c">Начните <em>с сути</em></div></div>
""" % BASE_CSS


def render(html, w, h, dest):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        src = os.path.join(HERE, "_render.html")
        open(src, "w", encoding="utf-8").write(html)
        png = os.path.join(tmp, "p.png")
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--allow-file-access-from-files",
                        "--window-size=%d,%d" % (w, h), "--virtual-time-budget=3000",
                        "--screenshot=" + png, "file:///" + src.replace("\\", "/"),
                        "--user-data-dir=" + os.path.join(tmp, "ud")],
                       capture_output=True, timeout=120)
        for _ in range(40):
            if os.path.exists(png):
                time.sleep(0.5)
                break
            time.sleep(0.5)
        im = Image.open(png).convert("RGB").crop((0, 0, w, h))
        im.load()
        os.remove(src)
    if dest.endswith(".jpg"):
        im.save(dest, quality=88)
    return im


def main():
    os.makedirs(IMG, exist_ok=True)
    with open(os.path.join(IMG, "favicon.svg"), "w", encoding="utf-8", newline="\n") as f:
        f.write(FAVICON)
    icon = render(ICON, 512, 512, "")
    icon.resize((180, 180), Image.LANCZOS).save(os.path.join(IMG, "apple-touch-icon.png"))
    icon.resize((32, 32), Image.LANCZOS).save(os.path.join(IMG, "favicon-32.png"))
    render(OG, 1200, 630, os.path.join(IMG, "og.jpg"))
    print("img/: favicon.svg, favicon-32.png, apple-touch-icon.png, og.jpg")


if __name__ == "__main__":
    main()
