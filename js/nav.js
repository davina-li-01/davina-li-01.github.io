// The active nav item is marked with aria-current="page" directly in each
// document, so highlighting works before this file loads and without JS.
document.addEventListener('DOMContentLoaded', function () {
  setupBackButton();
  setupMenu();
  setupScrollCue();
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
  setupTabs();
});

// Product / Marketing on the work page. The URL hash picks the starting tab,
// including a hash that points at a single project inside one of the panels,
// so links like projects.html#reel-agent land in the right place.
function setupTabs() {
  var bar = document.querySelector('[data-tabs]');
  if (!bar) return;

  var tabs = Array.prototype.slice.call(bar.querySelectorAll('[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));

  function show(name, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== name;
    });
  }

  function fromHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return null;
    var el = document.getElementById(id);
    var panel = el && el.closest('[data-panel]');
    return panel ? panel.getAttribute('data-panel') : null;
  }

  bar.hidden = false;
  document.documentElement.classList.add('js-tabs');

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      var name = t.getAttribute('data-tab');
      show(name);
      history.replaceState(null, '', '#' + name);
    });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      show(next.getAttribute('data-tab'), true);
    });
  });

  // Links elsewhere on the page that should switch tabs before scrolling.
  document.querySelectorAll('[data-tab-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      show(a.getAttribute('data-tab-link'));
    });
  });

  window.addEventListener('hashchange', function () {
    var name = fromHash();
    if (name) show(name);
  });

  show(fromHash() || tabs[0].getAttribute('data-tab'));
}

// The drawer for narrow screens. The button is hidden by CSS above 720px, so
// there is nothing to undo on wide screens beyond resetting state if someone
// resizes while it is open.
function setupMenu() {
  var burger = document.querySelector('[data-burger]');
  var nav = document.querySelector('[data-nav]');
  if (!burger || !nav) return;

  var open = false;

  function set(state) {
    open = state;
    burger.setAttribute('aria-expanded', String(state));
    burger.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
    nav.setAttribute('data-open', String(state));
    // Closed, the drawer is clipped rather than removed, so it would still be
    // reachable by keyboard. inert takes it out of the tree entirely.
    if (state) nav.removeAttribute('inert');
    else nav.setAttribute('inert', '');
  }

  // The bar is only ever a drawer below the breakpoint; above it the nav is a
  // plain row and must never be inert.
  var narrow = window.matchMedia('(max-width: 720px)');

  function apply() {
    if (narrow.matches) {
      set(open);
    } else {
      open = false;
      burger.setAttribute('aria-expanded', 'false');
      nav.removeAttribute('data-open');
      nav.removeAttribute('inert');
    }
  }

  burger.addEventListener('click', function () { set(!open); });

  // Anywhere outside the bar closes it, which is what people try first.
  document.addEventListener('click', function (e) {
    if (!open) return;
    if (e.target.closest('.bar')) return;
    set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) {
      set(false);
      burger.focus();
    }
  });

  // In-page anchors do not reload, so the drawer would stay open over the
  // section it just scrolled to.
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });

  if (narrow.addEventListener) narrow.addEventListener('change', apply);
  else narrow.addListener(apply);

  apply();
}

// Only offer "back" when there is somewhere on this site to go back to.
function setupBackButton() {
  var backBtn = document.getElementById('backBtn');
  if (!backBtn) return;

  var page = window.location.pathname.split('/').pop() || 'index.html';
  var sameOrigin = document.referrer && document.referrer.indexOf(window.location.origin) === 0;

  if (page !== 'index.html' && window.history.length > 1 && sameOrigin) {
    backBtn.hidden = false;
  }

  backBtn.addEventListener('click', function () {
    window.history.back();
  });
}

// Retire the cue once the reader has taken the hint. Without JS it simply
// stays put, which is harmless — it is a working link either way.
function setupScrollCue() {
  var cue = document.querySelector('[data-scrollcue]');
  if (!cue) return;

  function sync() {
    if (window.scrollY > 80) cue.setAttribute('data-past', '');
    else cue.removeAttribute('data-past');
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; sync(); });
  }, { passive: true });

  sync();
}

// The track scrolls and snaps on its own. This only adds the buttons and the
// counter, and only if the track actually overflows.
function setupCarousel(root) {
  var track = root.querySelector('[data-track]');
  var ctrl = root.querySelector('[data-ctrl]');
  if (!track || !ctrl) return;

  var prev = root.querySelector('[data-prev]');
  var next = root.querySelector('[data-next]');
  var range = root.querySelector('[data-range]');
  var items = Array.prototype.slice.call(track.children);
  if (items.length < 2) return;

  function overflows() {
    return track.scrollWidth - track.clientWidth > 4;
  }

  // One panel plus one gap.
  function step() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return items[0].getBoundingClientRect().width + gap;
  }

  // Which panels are actually on screen. Counting only the leftmost one made
  // the readout stall at "4 / 6" once the track hit the end, because panel 4
  // is as far left as it can ever get. A range tells the truth at both ends.
  function visibleRange() {
    var view = track.getBoundingClientRect();
    var first = -1;
    var last = -1;

    items.forEach(function (li, i) {
      var r = li.getBoundingClientRect();
      var shown = Math.min(r.right, view.right) - Math.max(r.left, view.left);
      if (shown > r.width * 0.6) {
        if (first < 0) first = i;
        last = i;
      }
    });

    if (first < 0) {
      first = Math.min(items.length - 1, Math.round(track.scrollLeft / step()));
      last = first;
    }
    return [first + 1, last + 1];
  }

  function sync() {
    ctrl.hidden = !overflows();
    if (ctrl.hidden) return;

    var max = track.scrollWidth - track.clientWidth;

    if (range) {
      var r = visibleRange();
      range.textContent = r[0] === r[1] ? String(r[0]) : r[0] + '-' + r[1];
    }
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max - 2;
  }

  function go(dir) {
    track.scrollBy({ left: dir * step(), behavior: 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });

  var queued = false;
  track.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; sync(); });
  }, { passive: true });

  if (window.ResizeObserver) {
    new ResizeObserver(sync).observe(track);
  } else {
    window.addEventListener('resize', sync);
  }

  sync();
}
