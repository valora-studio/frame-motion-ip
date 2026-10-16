// Frame & Motion: меню на узком экране + движение по ходу страницы.
// Без JS страница видна целиком: всё скрытое прячется только под html.js.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- меню ----------
  var top = document.querySelector('.top');
  var burger = top && top.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = top.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? 'Закрыть' : 'Меню';
    });
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function mmss(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // Прогресс элемента: 0 — верх элемента у `start` доли окна,
  // 1 — низ элемента дошёл до `end` доли высоты окна.
  function progress(el, start, end) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    var from = vh * start, to = vh * end - r.height;
    return clamp((from - r.top) / (from - to));
  }

  // ---------- заголовок: разбить на слова ----------
  $$('.hero h1, .doc h1').forEach(function (h) {
    var words = h.textContent.trim().split(/[ \t\r\n]+/); // неразрывные пробелы не трогаем
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="--i:' + i + '"><span>' + w + '</span></span>';
    }).join(' ');
    h.classList.add('split');
    h.setAttribute('aria-label', words.join(' '));
  });

  // линейки, которые прочерчиваются
  $$('.rows, .faq, .steps, .price, .contacts, .who, .cut, .std__list').forEach(function (el) { el.classList.add('draw'); });

  // ---------- ролик на первом экране ----------
  // Сценарий — в data-caps: «фраза~секунды|фраза~секунды». Слово в *звёздочках* — акцент.
  $$('.reel').forEach(function (box) {
    var caps = box.getAttribute('data-caps').split('|').map(function (c) {
      var p = c.split('~');
      return { words: p[0].split(' ').map(function (w) { return w.replace(/\*(.+?)\*/, '<em>$1</em>'); }), dur: +p[1] };
    });
    var T = 0;
    caps.forEach(function (c) { c.at = T; T += c.dur; });
    var shots = $$('.shot', box), flash = box.querySelector('.flash'), cap = box.querySelector('.cap');
    var bar = box.querySelector('.phone__bar i'), ph = box.querySelector('.tl__ph'), time = box.querySelector('.tl__time');
    var cur = -1, shown = -1;

    function render(t) {
      var k = 0;
      while (k < caps.length - 1 && t >= caps[k + 1].at) k++;
      var c = caps[k];
      if (k !== cur) {
        cur = k; shown = -1;
        shots.forEach(function (s, i) { s.classList.toggle('is-on', i === k % shots.length); });
        if (!reduce) { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }
        cap.innerHTML = c.words.map(function (w) { return '<span>' + w + '</span>'; }).join(' ');
      }
      // слова появляются за голосом: вся фраза — за первые 70 % её времени
      var n = reduce ? c.words.length : Math.min(c.words.length, 1 + Math.floor((t - c.at) / (c.dur * .7) * c.words.length));
      if (n !== shown) {
        shown = n;
        $$('span', cap).forEach(function (s, i) { s.classList.toggle('is-on', i < n); });
      }
      var p = t / T;
      bar.style.width = (p * 100).toFixed(2) + '%';
      ph.style.left = (p * 100).toFixed(2) + '%';
      time.textContent = mmss(t);
    }

    if (reduce) { render(caps[0].dur * .9); return; }
    var visible = true, t0 = 0, last = 0;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(box);
    requestAnimationFrame(function loop(now) {
      if (!t0) t0 = now + 900;                 // старт — когда ролик проявился
      if (!visible || document.hidden) t0 += now - (last || now);   // вне экрана — пауза
      last = now;
      render(Math.max(0, ((now - t0) / 1000) % T));
      requestAnimationFrame(loop);
    });
  });

  if (reduce) {
    // без движения — сразу конечное состояние каждой сцены
    $$('.split, .draw').forEach(function (el) { el.classList.add('is-in'); });
    document.body.classList.add('is-loaded');
    $$('.cut__time b').forEach(function (b) { b.textContent = mmss(+b.getAttribute('data-keep')); });
    $$('.seg:not(.seg--keep)').forEach(function (s) { s.style.flexGrow = 0; s.style.marginRight = '-2px'; });
    $$('.chk').forEach(function (c) { c.classList.add('is-done'); });
    return;
  }

  // первый экран — одна сцена при загрузке
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
      $$('.split').forEach(function (h) { h.classList.add('is-in'); });
    });
  });

  // ---------- появление по мере прокрутки ----------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.draw').forEach(function (el) { io.observe(el); });

  // ---------- сцены, привязанные к прокрутке ----------
  var scenes = [];

  // 1. Сырьё → ролик: лишние куски схлопываются по очереди, хронометраж тает.
  $$('.cut').forEach(function (box) {
    var segs = $$('.seg', box), out = box.querySelector('.cut__time b');
    var raw = +out.getAttribute('data-raw');
    var cuts = segs.filter(function (s) { return !s.classList.contains('seg--keep'); });
    // режем в монтажном порядке: сначала паузы, потом оговорки, потом дубли
    var order = ['pause', 'slip', 'take'];
    cuts.sort(function (a, b) {
      var ka = order.indexOf(a.className.split('seg--')[1]), kb = order.indexOf(b.className.split('seg--')[1]);
      return ka - kb || segs.indexOf(a) - segs.indexOf(b);
    });
    var step = .8 / cuts.length;
    scenes.push(function () {
      var p = progress(box, .85, .55), gone = 0;
      cuts.forEach(function (s, i) {
        var k = ease(clamp((p - .1 - i * step) / (step * 2.2)));
        var sec = +s.getAttribute('data-s');
        s.style.flexGrow = (sec * (1 - k)).toFixed(3);
        s.style.marginRight = k > .98 ? '-2px' : '';     // съесть зазор у исчезнувшего куска
        s.style.opacity = (1 - k * .6).toFixed(3);
        gone += sec * k;
      });
      out.textContent = mmss(raw - gone);
    });
  });

  // 2. Цены: строки проявляются по очереди.
  $$('.price').forEach(function (table) {
    var rows = $$('tbody tr', table);
    table.classList.add('is-scrub');
    scenes.push(function () {
      var p = progress(table, .95, .85);
      var on = Math.min(rows.length, Math.floor(p * (rows.length + .999)));
      rows.forEach(function (r, i) { r.classList.toggle('is-on', i < on); });
    });
  });

  // 3. Шаги: линия пути тянется вдоль номеров.
  $$('.steps').forEach(function (box) {
    var steps = $$('.step', box);
    var track = document.createElement('div');
    track.className = 'steps__track';
    track.innerHTML = '<i class="steps__fill"></i>';
    box.insertBefore(track, box.firstChild);
    scenes.push(function () {
      var mid = window.innerHeight * .55;
      var r = track.getBoundingClientRect();
      track.style.setProperty('--p', clamp((mid - r.top) / r.height).toFixed(4));
      steps.forEach(function (s) { s.classList.toggle('is-on', s.getBoundingClientRect().top + 40 < mid); });
    });
  });

  // 4. Стандарт: пункт в середине экрана — на телефоне его подсказка, пройденные отмечены.
  $$('.std').forEach(function (box) {
    var rows = $$('.chk', box), phone = box.querySelector('.std__phone');
    scenes.push(function () {
      var mid = window.innerHeight * .55, cur = 0;
      rows.forEach(function (r, i) { if (r.getBoundingClientRect().top < mid) cur = i; });
      rows.forEach(function (r, i) { r.classList.toggle('is-done', r.getBoundingClientRect().top < mid - 40 && i <= cur); });
      phone.setAttribute('data-ov', rows[cur].getAttribute('data-ov'));
    });
  });

  if (!scenes.length) return;
  var ticking = false;
  function frame() { ticking = false; scenes.forEach(function (f) { f(); }); }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  frame();
})();
