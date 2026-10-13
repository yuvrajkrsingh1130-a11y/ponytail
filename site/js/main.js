/* Auto Spa America — behaviour layer. Lenis owns the scroll; everything that
 * reacts to it is driven from one rAF loop fed by lenis.scroll. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var ASA = window.ASA;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Lenis: global inertial scroll ---- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });
  }

  function scrollTo(el) {
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---- anchor navigation goes through Lenis ---- */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash.length < 2) return;
    var target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    closeSheet();
    scrollTo(target);
    history.replaceState(null, '', hash);
  });

  /* ---- mobile sheet ---- */
  var burger = document.querySelector('.burger');
  var sheet = document.getElementById('sheet');

  function openSheet() {
    sheet.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', function () {
    if (sheet.hidden) openSheet(); else closeSheet();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeSheet();
  });

  /* ---- header + current section ---- */
  var head = document.getElementById('head');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var navTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function updateHead(y) {
    head.classList.toggle('is-stuck', y > 30);
    var current = -1;
    for (var i = 0; i < navTargets.length; i++) {
      var el = navTargets[i];
      if (el && el.getBoundingClientRect().top + y - 160 <= y) current = i;
    }
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
  }

  /* ---- reveal on enter ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal, .step'));
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.14 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- process track progress ---- */
  var track = document.getElementById('track');
  var trackFill = document.getElementById('track-fill');

  function updateTrack() {
    var rect = track.getBoundingClientRect();
    var vh = window.innerHeight;
    var progress = ASA.clamp01((vh * 0.82 - rect.top) / (rect.height + vh * 0.3));
    trackFill.style.width = (progress * 100).toFixed(1) + '%';
  }

  /* ---- pricing deck: fan on scroll ---- */
  var deck = document.getElementById('deck');
  var packages = document.getElementById('packages');
  var hint = document.getElementById('packages-hint');
  var cards = Array.prototype.slice.call(deck.children);
  var metrics = { top: 0, range: 1, scale: 1 };

  function measure() {
    // Fan the deck out once at full spread, measure how wide it really lands,
    // then scale the whole deck down if the viewport is narrower than that.
    cards.forEach(function (card, i) {
      card.style.transform = ASA.fanTransform(i, cards.length, 1).transform;
    });
    var bounds = deck.getBoundingClientRect();
    var left = Infinity;
    var right = -Infinity;
    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
    });
    metrics.scale = Math.min(1, bounds.width / Math.max(1, right - left));
    deck.style.transform = metrics.scale < 1 ? 'scale(' + metrics.scale.toFixed(4) + ')' : '';
    metrics.top = packages.getBoundingClientRect().top + window.scrollY;
    metrics.range = Math.max(1, packages.offsetHeight - window.innerHeight);
  }

  function updateDeck(y) {
    var progress = ASA.clamp01((y - metrics.top) / metrics.range);
    for (var i = 0; i < cards.length; i++) {
      var frame = ASA.fanTransform(i, cards.length, progress);
      cards[i].style.transform = frame.transform;
      cards[i].style.opacity = frame.opacity;
      cards[i].style.zIndex = frame.zIndex;
    }
    hint.classList.toggle('is-hidden', progress > 0.03);
  }

  /* ---- Sedan / SUV toggle ---- */
  var toggleButtons = Array.prototype.slice.call(document.querySelectorAll('.toggle__btn'));
  var amounts = Array.prototype.slice.call(document.querySelectorAll('.card__amount'));
  var unitLabels = Array.prototype.slice.call(document.querySelectorAll('[data-vehicle-label]'));

  function setVehicle(vehicle) {
    toggleButtons.forEach(function (button) {
      var active = button.dataset.vehicle === vehicle;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    amounts.forEach(function (el) {
      var value = Number(el.dataset[vehicle]);
      if (el.textContent === ASA.formatPrice(value)) return;
      el.classList.add('is-swapping');
      window.setTimeout(function () {
        el.textContent = ASA.formatPrice(value);
        el.classList.remove('is-swapping');
      }, 200);
    });
    unitLabels.forEach(function (el) {
      el.textContent = vehicle === 'suv' ? 'SUV' : 'Sedan';
    });
  }

  toggleButtons.forEach(function (button) {
    button.addEventListener('click', function () { setVehicle(button.dataset.vehicle); });
  });

  /* ---- one loop, fed by Lenis ---- */
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  function tick(time) {
    if (lenis) lenis.raf(time);
    var y = lenis ? lenis.scroll : window.scrollY;
    updateHead(y);
    updateDeck(y);
    updateTrack();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
