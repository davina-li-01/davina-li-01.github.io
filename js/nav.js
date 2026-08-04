// The active nav item is marked with aria-current="page" directly in each
// document, so highlighting works before this file loads and without JS.
document.addEventListener('DOMContentLoaded', function () {
  setupBackButton();
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
});

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
