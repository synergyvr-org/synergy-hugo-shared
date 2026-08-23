// Image lists and the base path are supplied by
// layouts/partials/custom-header.html, so this file carries neither a site path
// nor any site's artwork. Both lists may be empty, in which case the
// corresponding randomizer is skipped.
const synergyImages = window.synergyImages || {};
const imageBase = synergyImages.base || '/images/';
const img = (name) => imageBase + name;
const bannerImages = synergyImages.cover || [];
const backgroundImages = synergyImages.asideArt || [];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// A single background-image can't respond to pixel density, so a cover on a
// retina display gets upscaled. image-set() fixes that where a site ships a
// higher-resolution sibling: params.synergy.coverRetina holds the suffix (e.g.
// "@2x"), and unset means the site has 1x only.
//
// Browsers that can't parse image-set() discard the whole declaration, which
// would leave the banner with no picture at all — so probe it on a detached
// element first and fall back to the plain URL. Older Safari wants the
// -webkit- prefix, hence the two candidates.
const coverRetina = synergyImages.coverRetina || '';
const probe = document.createElement('div');
const supported = (value) => {
  probe.style.backgroundImage = '';
  probe.style.backgroundImage = value;
  return probe.style.backgroundImage !== '';
};
const coverImage = (name) => {
  const one = img(name);
  if (!coverRetina) return `url("${one}")`;
  const two = img(name.replace(/(\.[a-z0-9]+)$/i, `${coverRetina}$1`));
  for (const fn of ['image-set', '-webkit-image-set']) {
    const value = `${fn}(url("${one}") 1x, url("${two}") 2x)`;
    if (supported(value)) return value;
  }
  return `url("${one}")`;
};

document.addEventListener('DOMContentLoaded', () => {
  // Randomize cover screenshots
  const cover = document.querySelector('.cover');
  if (cover && bannerImages.length) {
    cover.style.backgroundImage = coverImage(pick(bannerImages));
    // Only a cover with a picture earns the taller banner; without this a site
    // that hasn't supplied coverImages yet gets a tall empty band instead of a
    // plain title bar. See .cover in _base.scss.
    cover.classList.add('has-image');
  }

  // Randomize <aside> background images
  if (backgroundImages.length) {
    document.querySelectorAll('.aside-alert .body').forEach(function (alertBox) {
      alertBox.style.backgroundImage = `url(${img(pick(backgroundImages))})`;
    });
  }

  // Video players
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  document.querySelectorAll('.video-player').forEach(player => {
    const video = player.querySelector('video');
    const btnPlay = player.querySelector('.btn-play');
    const iconPlay = btnPlay.querySelector('.icon-play');
    const iconPause = btnPlay.querySelector('.icon-pause');
    const progressBar = player.querySelector('.progress-bar');
    const progressFilled = player.querySelector('.progress-filled');
    const progressBuffered = player.querySelector('.progress-buffered');
    const timeDisplay = player.querySelector('.time');
    const btnMute = player.querySelector('.btn-mute');
    const iconUnmuted = btnMute.querySelector('.icon-unmuted');
    const iconMuted = btnMute.querySelector('.icon-muted');
    const volumeSlider = player.querySelector('.volume-slider');
    const btnFullscreen = player.querySelector('.btn-fullscreen');

    function togglePlay() {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    function updatePlayIcon() {
      const playing = !video.paused;
      iconPlay.style.display = playing ? 'none' : '';
      iconPause.style.display = playing ? '' : 'none';
    }

    btnPlay.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    video.addEventListener('play', updatePlayIcon);
    video.addEventListener('pause', updatePlayIcon);

    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        progressFilled.style.width = (video.currentTime / video.duration * 100) + '%';
        timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
      }
    });

    video.addEventListener('progress', () => {
      if (video.buffered.length && video.duration) {
        progressBuffered.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + '%';
      }
    });

    let dragging = false;

    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
    });

    progressBar.addEventListener('mousedown', () => { dragging = true; });
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = ratio * video.duration;
    });

    btnMute.addEventListener('click', () => {
      video.muted = !video.muted;
      iconUnmuted.style.display = video.muted ? 'none' : '';
      iconMuted.style.display = video.muted ? '' : 'none';
    });

    volumeSlider.addEventListener('input', () => {
      video.volume = volumeSlider.value;
      video.muted = video.volume === 0;
      iconUnmuted.style.display = video.muted ? 'none' : '';
      iconMuted.style.display = video.muted ? '' : 'none';
    });

    btnFullscreen.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        player.requestFullscreen();
      }
    });
  });
});

// Filter + collapsible folders for the load order reference table (load-order/*)
document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('modlist-filter');
  var table = document.getElementById('modlist-table');
  if (!input || !table) return;

  var tbody = table.tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);
  var countEl = document.getElementById('modlist-count');
  var toggleAllBtn = document.getElementById('modlist-toggle-all');
  var wrap = table.closest('.modlist');

  function isSep(r) { return r.classList.contains('modlist-separator'); }
  function isFolder(r) { return r.classList.contains('modlist-folder'); }
  function depthOf(r) { return parseInt(r.getAttribute('data-depth'), 10) || 0; }
  function totalMods() { return rows.filter(function (r) { return !isSep(r); }).length; }
  function filtering() { return input.value.trim() !== ''; }

  var folders = rows.filter(isFolder);

  // The chain of folder rows enclosing each row, walked once here rather than on
  // every keystroke. It's also what lets "show in list" open exactly the folders
  // a row is buried under: the reveal and the hiding read the same chain, so
  // they can't disagree about where a row lives.
  //
  // A separator carrying a depth closes any folder at that depth or deeper. That
  // holds for the labels that aren't folders too (a list's title banner, its
  // "End Of List" marker), which sit at the top level and so belong inside
  // nothing — without the pop, collapsing the last folder would swallow the end
  // marker. Depth-less separators (the authors' inline notes) are leaves, and
  // nest inside whatever folder is open, like the mods around them.
  var ancestors = new Map();
  (function () {
    var stack = [];
    rows.forEach(function (r) {
      var d = isSep(r) ? depthOf(r) : 0;
      if (d >= 1) {
        while (stack.length && depthOf(stack[stack.length - 1]) >= d) stack.pop();
      }
      ancestors.set(r, stack.slice());
      if (isFolder(r)) stack.push(r);
    });
  })();

  function chainOpen(r) {
    return (ancestors.get(r) || []).every(function (f) {
      return !f.classList.contains('collapsed');
    });
  }

  // Cache each row's searchable text before the locate buttons go in, so the
  // filter never has to re-read the DOM (and never sees the buttons).
  rows.forEach(function (r) { r._text = r.textContent.toLowerCase(); });
  function allCollapsed() {
    return folders.length > 0 && folders.every(function (s) {
      return s.classList.contains('collapsed');
    });
  }
  function updateToggleLabel() {
    if (toggleAllBtn) toggleAllBtn.textContent = allCollapsed() ? 'Expand all' : 'Collapse all';
  }

  // Filtering ignores the folder structure and shows every match wherever it
  // lives; otherwise a row shows when every folder enclosing it is open. The
  // `filtering` class on the wrapper is what puts the locate buttons on screen.
  function applyVisibility() {
    var q = input.value.trim().toLowerCase();
    var filtered = q !== '';
    var shown = 0;
    rows.forEach(function (r) {
      var visible = filtered ? r._text.indexOf(q) !== -1 : chainOpen(r);
      r.style.display = visible ? '' : 'none';
      if (visible && !isSep(r)) shown++;
    });
    if (wrap) wrap.classList.toggle('filtering', filtered);
    if (countEl) countEl.textContent = filtered ? shown : totalMods();
  }

  // Reflect a folder's state in its icon: open when expanded, closed when collapsed.
  function setFolderState(sep, collapsed) {
    sep.classList.toggle('collapsed', collapsed);
    sep.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    var icon = sep.querySelector('.fa-folder, .fa-folder-open');
    if (icon) {
      icon.classList.toggle('fa-folder', collapsed);
      icon.classList.toggle('fa-folder-open', !collapsed);
    }
  }

  function toggle(sep) {
    setFolderState(sep, !sep.classList.contains('collapsed'));
    applyVisibility();
    updateToggleLabel();
  }

  function setAll(collapsed) {
    folders.forEach(function (s) { setFolderState(s, collapsed); });
    applyVisibility();
    updateToggleLabel();
  }

  // Make folders focusable, keyboard-operable collapse toggles.
  folders.forEach(function (r) {
    r.setAttribute('tabindex', '0');
    r.setAttribute('role', 'button');
    r.setAttribute('aria-expanded', 'true');
  });

  // Put a row back in context: drop the filter, open the folders it's buried
  // under, and scroll to where it actually sits in the list. This is how a
  // search behaves in MO2 — you find the row, then you want to see what's
  // around it, which is usually the real question ("what loads after this?").
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reveal(row) {
    (ancestors.get(row) || []).forEach(function (f) { setFolderState(f, false); });
    input.value = '';
    applyVisibility();
    updateToggleLabel();
    rows.forEach(function (r) { r.classList.remove('modlist-located'); });
    row.classList.add('modlist-located');
    // Focus the row so the jump lands somewhere for keyboard and screen-reader
    // users. Folders are already focusable; a leaf needs a tabindex, and -1
    // gives it one without adding a tab stop for every mod in the list.
    if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '-1');
    row.focus({ preventScroll: true });
    row.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // One locate button per row, hidden until the filter is active: with no filter
  // every row is already in context, and `display: none` keeps ~400 buttons out
  // of the tab order. It goes in the last cell so it lands at the right edge of
  // the row, clear of the mod name and its Nexus link.
  rows.forEach(function (r) {
    var cell = r.cells[r.cells.length - 1];
    if (!cell) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modlist-locate';
    btn.title = 'Show in list';
    btn.setAttribute('aria-label', 'Show this row in the list');
    btn.innerHTML = '<i class="fa fa-crosshairs"></i>';
    cell.appendChild(btn);
  });

  tbody.addEventListener('click', function (e) {
    if (e.target.closest('a')) return; // Nexus links keep working
    var row = e.target.closest('tr');
    if (!row) return;
    // While filtering, the whole row is the locate target, so the button is an
    // affordance rather than the only way in. Otherwise a folder row toggles.
    if (e.target.closest('.modlist-locate') || filtering()) reveal(row);
    else if (isFolder(row)) toggle(row);
  });
  tbody.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('.modlist-locate')) return; // the button fires its own click
    var row = e.target.closest('tr');
    if (!row) return;
    e.preventDefault();
    if (filtering()) reveal(row);
    else if (isFolder(row)) toggle(row);
  });

  // Let the flash re-run if the same row is located twice.
  tbody.addEventListener('animationend', function (e) {
    if (e.animationName !== 'modlist-located') return;
    var row = e.target.closest('tr');
    if (row) row.classList.remove('modlist-located');
  });

  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', function () { setAll(!allCollapsed()); });
  }

  var clearBtn = document.getElementById('modlist-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      applyVisibility();
      input.focus();
    });
  }

  input.addEventListener('input', applyVisibility);

  // Open on the sections rather than on several hundred mods: a collapsed list
  // reads as an outline of the load order, and the filter and the locate button
  // are how you get from there to a specific mod.
  setAll(true);

  // Autofocus the filter. Deferred past this DOMContentLoaded tick so it runs
  // after the theme's own documentFocus() (which focuses #R-body-inner on load).
  // preventScroll keeps the page from jumping to the input.
  setTimeout(function () { input.focus({ preventScroll: true }); }, 0);
});

// Deep-linking for disclosures: when the URL hash targets a
// <details class="disclosure"> (see the `disclosure` shortcode), open it and
// scroll it into view. Runs on load and whenever the hash changes (e.g. an
// on-page anchor click). The link itself works without this; this just makes a
// followed link expand the accordion instead of landing on a collapsed header.
function openDisclosureFromHash() {
  if (!window.location.hash) return;
  var id = decodeURIComponent(window.location.hash.slice(1));
  var el = document.getElementById(id);
  if (el && el.tagName === 'DETAILS' && el.classList.contains('disclosure')) {
    el.open = true;
    el.scrollIntoView();
  }
}
document.addEventListener('DOMContentLoaded', openDisclosureFromHash);
window.addEventListener('hashchange', openDisclosureFromHash);

// Click-to-copy for the disclosure permalinks, mirroring the theme's heading
// anchors: copy the entry's absolute URL and flash the theme's toast, instead of
// navigating. (The theme's own anchor JS keys off parentElement.id, which is the
// <p> here, so we handle these ourselves.) Falls back to normal link navigation
// if the Clipboard API is unavailable.
document.addEventListener('DOMContentLoaded', function () {
  var toast = function (msg) {
    if (window.relearn && window.relearn.showToast) window.relearn.showToast(msg);
  };
  document.querySelectorAll('.disclosure-anchor').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return; // let the href do its thing
      e.preventDefault();
      this.blur();
      // Build the permalink like the theme does: origin + path + #id, so any
      // query string on the current URL isn't dragged into the copied link.
      var url = window.location.origin + window.location.pathname + this.hash;
      navigator.clipboard.writeText(url);
      toast(window.T_Link_copied_to_clipboard || 'Link copied to clipboard');
    });
  });
});

// Console command reference filter (see the `console-commands` shortcode).
// Hides rows that don't match every whitespace-separated term, then hides any
// category left with no visible rows, and updates the count.
document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('cc-filter');
  if (!input) return;
  var list = document.getElementById('cc-list');
  var countEl = document.getElementById('cc-count');
  var emptyEl = document.getElementById('cc-empty');
  var clearBtn = document.getElementById('cc-clear');
  var rows = Array.prototype.slice.call(list.querySelectorAll('tr.cc-row'));
  var cats = Array.prototype.slice.call(list.querySelectorAll('section.cc-category'));

  rows.forEach(function (r) { r._text = r.textContent.toLowerCase(); });

  function apply() {
    var words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (r) {
      var match = words.every(function (w) { return r._text.indexOf(w) !== -1; });
      r.hidden = !match;
      if (match) shown++;
    });
    cats.forEach(function (c) { c.hidden = !c.querySelector('tr.cc-row:not([hidden])'); });
    if (countEl) countEl.textContent = shown;
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  input.addEventListener('input', apply);
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      apply();
      input.focus();
    });
  }
  apply();
});
