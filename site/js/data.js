/* Auto Spa America — pure helpers the page renders with.
 * Plain script: it sets window.ASA. tests/site.test.js loads this file the same
 * way the browser does (new Function with a fake window), so keep it DOM-free.
 */
(function () {
  'use strict';

  function clamp01(n) {
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function formatPrice(value) {
    return '$' + Number(value).toLocaleString('en-US');
  }

  /* Fan geometry for the pricing deck. Pure so the deck's look can be checked
   * without a browser: progress 0 = stacked deck, progress 1 = fully fanned.
   * Each card starts its move `stagger` later than the one before it. */
  var SPREAD = 190;
  var ROT = 9;
  var LIFT = 20;
  var STAGGER = 0.07;

  function fanTransform(index, count, progress) {
    var mid = (count - 1) / 2;
    var offset = index - mid;
    var span = 1 - STAGGER * (count - 1);
    var eased = 1 - Math.pow(1 - clamp01((progress - index * STAGGER) / span), 3);
    var from = { x: 0, y: 34, z: -260, rot: 0, scale: 0.88, opacity: 0 };
    var to = { x: offset * SPREAD, y: Math.abs(offset) * LIFT, z: 0, rot: offset * ROT, scale: 1, opacity: 1 };
    return {
      transform:
        'translate3d(' + (from.x + (to.x - from.x) * eased).toFixed(2) + 'px,' +
        (from.y + (to.y - from.y) * eased).toFixed(2) + 'px,' +
        (from.z + (to.z - from.z) * eased).toFixed(2) + 'px) rotate(' +
        (from.rot + (to.rot - from.rot) * eased).toFixed(2) + 'deg) scale(' +
        (from.scale + (to.scale - from.scale) * eased).toFixed(4) + ')',
      opacity: (from.opacity + (to.opacity - from.opacity) * eased).toFixed(3),
      zIndex: String(index + 1),
      progress: eased
    };
  }

  window.ASA = { clamp01: clamp01, formatPrice: formatPrice, fanTransform: fanTransform };
})();
