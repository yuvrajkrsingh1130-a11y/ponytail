#!/usr/bin/env node
// Static self-check for the Auto Spa America landing page in site/. There is no
// DOM runner in this repo, so this asserts the things that silently break a
// static site: dead anchors, missing assets, and the deck's scroll math.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const site = path.join(root, 'site');
// Comments are stripped so the documented (commented-out) hero showreel source
// is not mistaken for a real asset reference.
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const css = fs.readFileSync(path.join(site, 'css', 'sections.css'), 'utf8');

function loadData() {
  const src = fs.readFileSync(path.join(site, 'js', 'data.js'), 'utf8');
  const window = {};
  new Function('window', src)(window); // same as the browser's script tag
  return window.ASA;
}

test('every in-page anchor resolves', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length > 0, 'no in-page anchors found');
  for (const anchor of anchors) {
    assert.ok(ids.has(anchor), `href="#${anchor}" has no matching id`);
  }
});

test('every local asset referenced by the page exists', () => {
  const refs = [
    ...[...html.matchAll(/(?:src|href|poster)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/(?:src|poster)='([^']+)'/g)].map((m) => m[1])
  ].filter((ref) => !/^(#|https?:|mailto:|tel:|data:)/.test(ref));

  assert.ok(refs.length > 0, 'no local asset references found');
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(site, ref)), `missing asset: site/${ref}`);
  }
});

test('the fonts the stylesheet asks for are shipped', () => {
  const faces = fs.readFileSync(path.join(site, 'css', 'base.css'), 'utf8');
  const files = [...faces.matchAll(/url\(\.\.\/(assets\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  assert.equal(files.length, 8, 'expected 8 self-hosted woff2 faces');
  for (const file of files) {
    assert.ok(fs.existsSync(path.join(site, file)), `missing font: site/${file}`);
  }
});

test('every image carries alt text', () => {
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length > 0, 'no images found');
  for (const img of imgs) {
    assert.match(img, /\balt="/, `image without alt: ${img.slice(0, 60)}`);
  }
});

test('vendored Lenis exposes the global the page uses', () => {
  const lenis = fs.readFileSync(path.join(site, 'assets', 'vendor', 'lenis.min.js'), 'utf8');
  assert.match(lenis, /globalThis\.Lenis=/, 'lenis.min.js does not export globalThis.Lenis');
  assert.match(html, /assets\/vendor\/lenis\.min\.js/, 'index.html does not load the vendored Lenis');
});

test('the pricing deck has four fully priced tiers', () => {
  const cards = [...html.matchAll(/<article class="card">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 4, 'expected 4 package cards');
  for (const [card] of cards) {
    const amounts = [...card.matchAll(/data-sedan="(\d+)" data-suv="(\d+)"/g)];
    assert.equal(amounts.length, 1, 'each card needs one data-sedan/data-suv price');
    assert.ok(Number(amounts[0][2]) > Number(amounts[0][1]), 'SUV price must exceed the sedan price');
  }
});

test('fanTransform stacks the deck, then fans it out monotonically', () => {
  const ASA = loadData();

  const stacked = [0, 1, 2, 3].map((i) => ASA.fanTransform(i, 4, 0));
  assert.equal(new Set(stacked.map((f) => f.transform)).size, 1, 'progress 0 must be one stack');
  assert.equal(stacked[0].opacity, '0.000', 'the stack must start invisible');

  const fanned = [0, 1, 2, 3].map((i) => ASA.fanTransform(i, 4, 1));
  const x = fanned.map((f) => Number(/translate3d\((-?[\d.]+)px/.exec(f.transform)[1]));
  const rot = fanned.map((f) => Number(/rotate\((-?[\d.]+)deg/.exec(f.transform)[1]));
  assert.deepEqual(x, [-285, -95, 95, 285], 'fan spread must be symmetric and ordered');
  assert.deepEqual(rot, [-13.5, -4.5, 4.5, 13.5], 'fan rotation must be symmetric and ordered');
  assert.ok(fanned.every((f) => f.opacity === '1.000'), 'progress 1 must be fully visible');

  assert.equal(ASA.fanTransform(0, 4, -5).progress, 0, 'progress below 0 clamps');
  assert.equal(ASA.fanTransform(0, 4, 5).progress, 1, 'progress above 1 clamps');
  assert.equal(ASA.formatPrice(1850), '$1,850');
});

test('the no-JS card fallback matches the fully fanned deck', () => {
  const ASA = loadData();
  const parts = (transform) => {
    const m = /translate3d\((-?[\d.]+)px,(-?[\d.]+)px,(-?[\d.]+)px\) rotate\((-?[\d.]+)deg\)/.exec(transform);
    assert.ok(m, `unparseable transform: ${transform}`);
    return m.slice(1).map(Number);
  };
  const expected = [0, 1, 2, 3].map((i) => parts(ASA.fanTransform(i, 4, 1).transform));
  const fallback = [1, 2, 3, 4].map((n) => {
    const rule = new RegExp(`\\.card:nth-child\\(${n}\\)\\{transform:([^}]+)\\}`).exec(css);
    assert.ok(rule, `no .card:nth-child(${n}) fallback rule`);
    return parts(rule[1]);
  });

  expected.forEach((want, i) => {
    assert.deepEqual(fallback[i], want, `card ${i + 1} fallback must match fanTransform at progress 1`);
  });
});
