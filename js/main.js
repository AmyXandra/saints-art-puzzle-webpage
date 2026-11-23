/* Saints Art Puzzle — page behaviour */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  /* ---------- Dates & year ---------- */
  var now = new Date();
  var fmt = function (opts) {
    try { return new Intl.DateTimeFormat('en-US', opts).format(now); } catch (e) { return null; }
  };
  var dates = {
    'long': fmt({ month: 'long', day: 'numeric' }),
    'long-upper': (fmt({ month: 'long', day: 'numeric' }) || '').toUpperCase(),
    'short': fmt({ month: 'short', day: 'numeric' })
  };
  document.querySelectorAll('[data-date]').forEach(function (el) {
    var v = dates[el.getAttribute('data-date')];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = now.getFullYear(); });

  /* ---------- Mobile menu ---------- */
  var header = $('.site-header');
  var toggle = $('.menu-toggle');
  var toggleUse = toggle && toggle.querySelector('use');

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (toggleUse) toggleUse.setAttribute('href', open ? '#i-close' : '#i-menu');
  }

  if (header && toggle) {
    toggle.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    header.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- Game frame ---------- */
  var frame = $('#game-frame');
  var launcher = $('#launcher');
  var iframe = null;
  var soundOn = true;
  var LAUNCHER_W = 760; // design width of the desktop start screen

  // Scale the desktop start screen to the frame's width.
  if (frame && launcher && 'ResizeObserver' in window) {
    new ResizeObserver(function () {
      var s = frame.clientWidth / LAUNCHER_W;
      if (s > 0) launcher.style.setProperty('--launcher-scale', s.toFixed(4));
    }).observe(frame);
  }

  function gameSrc() { return (frame && frame.getAttribute('data-game-src') || '').trim(); }

  function startGame() {
    if (!frame) return false;
    if (iframe) return true;

    var src = gameSrc();
    if (!src) {
      if (!$('.game__notice', frame)) {
        var n = document.createElement('div');
        n.className = 'game__notice';
        n.textContent = 'The game URL hasn’t been set yet (data-game-src on #game-frame).';
        frame.appendChild(n);
      }
      frame.classList.add('is-playing');
      console.warn('[Saints Art Puzzle] Set data-game-src on #game-frame to the game URL.');
      return false;
    }

    iframe = document.createElement('iframe');
    iframe.className = 'game__iframe';
    iframe.src = src;
    iframe.title = 'Saints Art Puzzle game';
    iframe.allow = 'fullscreen; autoplay; clipboard-write';
    iframe.setAttribute('allowfullscreen', '');
    iframe.addEventListener('load', function () { postToGame({ type: 'sap:sound', on: soundOn }); });
    frame.insertBefore(iframe, frame.firstChild);
    frame.classList.add('is-playing');
    iframe.focus();
    return true;
  }

  function reloadGame() {
    if (!iframe) { startGame(); return; }
    iframe.src = gameSrc();
  }

  // Messages the embedded game can listen for: { type: 'sap:sound', on: true|false }
  function postToGame(msg) {
    if (!iframe || !iframe.contentWindow) return;
    try { iframe.contentWindow.postMessage(msg, new URL(gameSrc(), location.href).origin); } catch (e) {}
  }

  /* Fullscreen: native where supported, CSS overlay otherwise (e.g. iPhone Safari). */
  var reqFs = frame && (frame.requestFullscreen || frame.webkitRequestFullscreen);
  var fsElement = function () { return document.fullscreenElement || document.webkitFullscreenElement; };

  function enterFullscreen() {
    startGame();
    if (!reqFs) { pseudoFullscreenOn(); return; }
    try {
      var p = reqFs.call(frame);
      if (p && p.catch) p.catch(pseudoFullscreenOn);
    } catch (e) {
      pseudoFullscreenOn();
      return;
    }
    // Some phones have the fullscreen function but quietly do nothing.
    setTimeout(function () { if (!fsElement()) pseudoFullscreenOn(); }, 400);
  }
  function pseudoFullscreenOn() {
    if (fsElement()) return;
    frame.classList.add('is-pseudo-fullscreen');
    document.documentElement.classList.add('has-pseudo-fullscreen');
    document.body.classList.add('has-pseudo-fullscreen');
  }
  function exitFullscreen() {
    if (fsElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
    frame.classList.remove('is-pseudo-fullscreen');
    document.documentElement.classList.remove('has-pseudo-fullscreen');
    document.body.classList.remove('has-pseudo-fullscreen');
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && frame && frame.classList.contains('is-pseudo-fullscreen')) exitFullscreen();
  });

  function toggleSound(btn) {
    soundOn = !soundOn;
    btn.setAttribute('aria-pressed', String(soundOn));
    var use = btn.querySelector('use');
    if (use) use.setAttribute('href', soundOn ? '#i-sound' : '#i-sound-off');
    postToGame({ type: 'sap:sound', on: soundOn });
    toast(soundOn ? 'Sound on' : 'Sound off');
  }

  function share() {
    var data = {
      title: 'Saints Art Puzzle',
      text: 'Solve today’s art puzzle to reveal the mystery saint.',
      url: location.href.split('#')[0]
    };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(data.url).then(
        function () { toast('Link copied'); },
        function () { toast(data.url); }
      );
    } else {
      toast(data.url);
    }
  }

  /* ---------- Video (YouTube, loaded on click) ---------- */
  function playVideo(btn) {
    var box = btn.closest('.video');
    var id = box && box.getAttribute('data-youtube-id');
    if (!id) { console.warn('[Saints Art Puzzle] Set data-youtube-id on .video'); return; }
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    f.title = 'How to play Saints Art Puzzle';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', '');
    box.replaceChildren(f);
  }

  /* ---------- Google AdSense ----------
     Publisher ID: <meta name="google-adsense-account"> in index.html.
     Ad unit IDs:  data-adsense-slot on each .ad placeholder.
     The striped placeholder shows until AdSense fills the slot (it stays if no ad is served). */
  (function initAds() {
    var meta = $('meta[name="google-adsense-account"]');
    var client = meta && meta.getAttribute('content').trim();
    if (!client) return;

    // The AdSense script tag is in <head>; only add it if a page leaves it out.
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
      document.head.appendChild(s);
    }

    document.querySelectorAll('[data-adsense-slot]').forEach(function (box) {
      var slot = box.getAttribute('data-adsense-slot').trim();
      if (!slot) return;
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      // Keep the striped "ADVERTISEMENT" placeholder until AdSense reports a filled ad.
      var label = document.createElement('span');
      label.className = 'ad__label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = box.textContent.trim() || 'ADVERTISEMENT';
      box.removeAttribute('aria-hidden');
      box.replaceChildren(label, ins);

      var markFilled = function () {
        box.classList.toggle('is-filled', ins.getAttribute('data-ad-status') === 'filled');
      };
      if ('MutationObserver' in window) {
        new MutationObserver(markFilled).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
      }

      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  })();

  /* ---------- Legal page: highlight the current section in the contents ---------- */
  (function initToc() {
    var links = document.querySelectorAll('.toc__links a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (!current && visible[id]) current = id; });
      if (!current) return;
      links.forEach(function (a) { a.classList.toggle('is-current', a === byId[current]); });
    }, { rootMargin: '-10% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  /* ---------- FAQ: copy embed code ---------- */
  function copyEmbed() {
    var code = $('#embed-code');
    if (!code) return;
    var text = code.textContent.trim();
    var fallback = function () {
      var r = document.createRange();
      r.selectNodeContents(code);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      toast('Press Ctrl+C / ⌘C to copy');
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast('Embed code copied'); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- Actions ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.getAttribute('data-action')) {
      case 'start': startGame(); break;
      case 'reload': reloadGame(); break;
      case 'fullscreen': enterFullscreen(); break;
      case 'exit-fullscreen': exitFullscreen(); break;
      case 'sound': toggleSound(btn); break;
      case 'share': share(); break;
      case 'play-video': playVideo(btn); break;
      case 'print': window.print(); break;
      case 'copy-embed': copyEmbed(); break;
    }
  });
})();
