const test = require('node:test');
const assert = require('node:assert/strict');
const { getZoomBounds, getOverviewTransform, clampTransform, zoomAt, reframeTransform, beginGesture, updateGesture } = require('./almanac-zoom.cjs');

const SHEET = { width: 760, height: 1100 };
const PHONE = { width: 360, height: 480 };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
const sheetPoint = (transform, point) => ({ x: (point.x - transform.x) / transform.scale, y: (point.y - transform.y) / transform.scale });

test('short phones start with the complete sheet visible while retaining room to zoom', () => {
  const view = { width: 360, height: 300 };
  const bounds = getZoomBounds(view, SHEET);
  near(bounds.widthScale * SHEET.width, view.width - 2);
  near(bounds.minScale * SHEET.height, view.height - 2);
  assert.ok(bounds.widthScale > bounds.minScale);
  assert.equal(bounds.maxScale, bounds.widthScale * 4);
  const initial = getOverviewTransform(view, SHEET);
  near(initial.scale, bounds.minScale);
  near(initial.x, (view.width - SHEET.width * initial.scale) / 2);
  assert.equal(initial.y, 0);
  assert.ok(SHEET.height * initial.scale <= view.height);
});

test('tall screens fit the full width without stretching the sheet vertically', () => {
  const view = { width: 390, height: 800 };
  const bounds = getZoomBounds(view, SHEET);
  assert.equal(bounds.minScale, bounds.widthScale);
  const fitted = clampTransform({ scale: bounds.minScale, x: -50, y: -100 }, view, SHEET);
  near(fitted.x, 1);
  assert.equal(fitted.y, 0);
  assert.ok(SHEET.height * fitted.scale < view.height);
});

test('panning cannot lose the sheet beyond any edge', () => {
  assert.deepEqual(clampTransform({ scale: 1, x: 70, y: 80 }, PHONE, SHEET), { scale: 1, x: 0, y: 0 });
  assert.deepEqual(clampTransform({ scale: 1, x: -2000, y: -2000 }, PHONE, SHEET), { scale: 1, x: -400, y: -620 });
  assert.deepEqual(clampTransform({ scale: 1, x: -100, y: -250 }, PHONE, SHEET), { scale: 1, x: -100, y: -250 });
});

test('zoom preserves the sheet point beneath an off-center pinch anchor', () => {
  const start = { scale: 0.8, x: -100, y: -150 };
  const anchor = { x: 135, y: 210 };
  const before = sheetPoint(start, anchor);
  const after = zoomAt(start, 1.2, anchor, PHONE, SHEET);
  const afterPoint = sheetPoint(after, anchor);
  near(afterPoint.x, before.x);
  near(afterPoint.y, before.y);
  assert.equal(after.scale, 1.2);
});

test('zoom bounds still preserve the pinch anchor when extra zoom is requested', () => {
  const bounds = getZoomBounds(PHONE, SHEET);
  const start = { scale: 1, x: -180, y: -320 };
  const anchor = { x: 180, y: 240 };
  const result = zoomAt(start, 100, anchor, PHONE, SHEET);
  assert.equal(result.scale, bounds.maxScale);
  const before = sheetPoint(start, anchor);
  const after = sheetPoint(result, anchor);
  near(before.x, after.x);
  near(before.y, after.y);
});

test('zooming out to the overview recenters horizontally and exposes the full sheet', () => {
  const result = zoomAt({ scale: 1.2, x: -400, y: -500 }, 0.01, { x: 320, y: 430 }, PHONE, SHEET);
  near(result.scale, getZoomBounds(PHONE, SHEET).minScale);
  near(result.x, (PHONE.width - SHEET.width * result.scale) / 2);
  assert.equal(result.y, 0);
  assert.ok(SHEET.width * result.scale <= PHONE.width);
  assert.ok(SHEET.height * result.scale <= PHONE.height);
});

test('rotation preserves relative zoom and the content under the viewport center', () => {
  const landscape = { width: 740, height: 300 };
  const start = { scale: 0.9, x: -150, y: -250 };
  const result = reframeTransform(start, PHONE, landscape, SHEET);
  near(result.scale / getZoomBounds(landscape, SHEET).widthScale, start.scale / getZoomBounds(PHONE, SHEET).widthScale);
  const before = sheetPoint(start, { x: PHONE.width / 2, y: PHONE.height / 2 });
  const after = sheetPoint(result, { x: landscape.width / 2, y: landscape.height / 2 });
  near(before.x, after.x);
  near(before.y, after.y);
  const restored = reframeTransform(result, landscape, PHONE, SHEET);
  near(restored.scale, start.scale);
  near(restored.x, start.x);
  near(restored.y, start.y);
});

test('reframing a sheet near its edge clamps to the new screen without blank overscroll', () => {
  const view = { width: 900, height: 900 };
  const result = reframeTransform({ scale: 0.8, x: 0, y: 0 }, PHONE, view, SHEET);
  const width = SHEET.width * result.scale;
  const height = SHEET.height * result.scale;
  assert.ok(result.x <= 0 && result.x >= view.width - width);
  assert.ok(result.y <= 0 && result.y >= view.height - height);
});

test('first valid layout initializes to the whole-sheet overview instead of preserving an unmeasured zoom', () => {
  const result = reframeTransform({ scale: 3, x: -200, y: -200 }, { width: 0, height: 0 }, PHONE, SHEET);
  assert.deepEqual(result, getOverviewTransform(PHONE, SHEET));
});

test('missing or invalid measurements never create nonfinite native transform values', () => {
  for (const view of [undefined, { width: 0, height: 0 }, { width: Infinity, height: 300 }, { width: 1, height: 1 }]) {
    assert.deepEqual(getZoomBounds(view, SHEET), { minScale: 1, widthScale: 1, maxScale: 4 });
    assert.deepEqual(clampTransform({ scale: NaN, x: Infinity, y: -Infinity }, view, SHEET), { scale: 1, x: 0, y: 0 });
    assert.deepEqual(zoomAt({ scale: 2, x: 10, y: 30 }, 3, { x: 20, y: 50 }, view, SHEET), { scale: 1, x: 0, y: 0 });
  }
  assert.deepEqual(clampTransform({}, PHONE, { width: 760, height: NaN }), { scale: 1, x: 0, y: 0 });
  const result = zoomAt({ scale: NaN, x: Infinity, y: NaN }, NaN, undefined, PHONE, SHEET);
  assert.ok(Object.values(result).every(Number.isFinite));
  near(result.scale, getZoomBounds(PHONE, SHEET).minScale);
});

test('automatic overview includes the entire sheet on portrait, short, landscape and large screens', () => {
  const viewports = [
    { width: 320, height: 300 },
    { width: 390, height: 580 },
    { width: 844, height: 180 },
    { width: 980, height: 750 },
  ];
  // Longer sheets represent six-week months, long festival footers, and large text.
  const sheets = [{ width: 760, height: 900 }, { width: 760, height: 1500 }, { width: 760, height: 2100 }];
  for (const viewport of viewports) {
    for (const sheet of sheets) {
      const result = getOverviewTransform(viewport, sheet);
      const scaledWidth = result.scale * sheet.width;
      const scaledHeight = result.scale * sheet.height;
      assert.ok(scaledWidth <= viewport.width - 2 + 1e-9);
      assert.ok(scaledHeight <= viewport.height - 2 + 1e-9);
      near(result.x, (viewport.width - scaledWidth) / 2);
      assert.equal(result.y, 0);
      assert.deepEqual(clampTransform({}, viewport, sheet), result);
      assert.deepEqual(clampTransform({ scale: NaN }, viewport, sheet), result);
    }
  }
});

test('a whole-sheet overview stays fully visible after rotation and returning to portrait', () => {
  const landscape = { width: 740, height: 180 };
  const longSheet = { width: 760, height: 1500 };
  const initial = getOverviewTransform(PHONE, longSheet);
  const rotated = reframeTransform(initial, PHONE, landscape, longSheet);
  assert.deepEqual(rotated, getOverviewTransform(landscape, longSheet));
  const restored = reframeTransform(rotated, landscape, PHONE, longSheet);
  assert.deepEqual(restored, initial);
});

test('overview resize tolerance covers floating-point drift without swallowing a deliberate zoom', () => {
  const landscape = { width: 740, height: 300 };
  const initial = getOverviewTransform(PHONE, SHEET);
  const rounded = { ...initial, scale: initial.scale * (1 + 0.00005) };
  assert.deepEqual(reframeTransform(rounded, PHONE, landscape, SHEET), getOverviewTransform(landscape, SHEET));
  const manual = { ...initial, scale: initial.scale * 1.01 };
  const resized = reframeTransform(manual, PHONE, landscape, SHEET);
  near(resized.scale / getZoomBounds(landscape, SHEET).widthScale, manual.scale / getZoomBounds(PHONE, SHEET).widthScale);
  assert.ok(resized.scale > getZoomBounds(landscape, SHEET).minScale);
});

const touch = (identifier, x, y) => ({ identifier, x, y });

test('pinching from the automatic overview enlarges details and pinching inward restores the complete sheet', () => {
  const initial = getOverviewTransform(PHONE, SHEET);
  const session = beginGesture([touch(1, 140, 240), touch(2, 220, 240)], initial);
  const zoomed = updateGesture(session, [touch(1, 100, 240), touch(2, 260, 240)], PHONE, SHEET);
  near(zoomed.transform.scale, initial.scale * 2);
  const before = sheetPoint(initial, { x: 180, y: 240 });
  const after = sheetPoint(zoomed.transform, { x: 180, y: 240 });
  near(before.x, after.x);
  near(before.y, after.y);
  const restored = updateGesture(zoomed.session, [touch(1, 160, 240), touch(2, 200, 240)], PHONE, SHEET);
  assert.deepEqual(restored.transform, initial);
});

test('a multi-touch trace zooms around the fingers and follows their moving midpoint', () => {
  const initial = { scale: 0.8, x: -100, y: -150 };
  let session = beginGesture([touch(1, 100, 200), touch(2, 200, 200)], initial);
  const underFingers = sheetPoint(initial, { x: 150, y: 200 });
  let result = updateGesture(session, [touch(1, 90, 220), touch(2, 240, 220)], PHONE, SHEET);
  near(result.transform.scale, 1.2);
  let anchored = sheetPoint(result.transform, { x: 165, y: 220 });
  near(anchored.x, underFingers.x);
  near(anchored.y, underFingers.y);
  session = result.session;
  result = updateGesture(session, [touch(2, 275, 240), touch(1, 75, 240)], PHONE, SHEET);
  near(result.transform.scale, 1.6);
  anchored = sheetPoint(result.transform, { x: 175, y: 240 });
  near(anchored.x, underFingers.x);
  near(anchored.y, underFingers.y);
});

test('lifting one finger rebases without a jump and the remaining finger can pan', () => {
  let session = beginGesture([touch(11, 90, 180), touch(22, 210, 180)], { scale: 0.9, x: -100, y: -140 });
  const pinched = updateGesture(session, [touch(11, 70, 200), touch(22, 250, 200)], PHONE, SHEET);
  const lifted = updateGesture(pinched.session, [touch(22, 250, 200)], PHONE, SHEET);
  assert.deepEqual(lifted.transform, pinched.transform);
  const dragged = updateGesture(lifted.session, [touch(22, 220, 180)], PHONE, SHEET);
  near(dragged.transform.x, pinched.transform.x - 30);
  near(dragged.transform.y, pinched.transform.y - 20);
  assert.equal(dragged.transform.scale, pinched.transform.scale);
  const released = updateGesture(dragged.session, [], PHONE, SHEET);
  assert.deepEqual(released.transform, dragged.transform);
  assert.deepEqual(released.session.identifiers, []);
});

test('adding or replacing fingers rebases even when the touch count stays the same', () => {
  const initial = { scale: 1, x: -150, y: -200 };
  const dragged = updateGesture(beginGesture([touch(1, 90, 100)], initial), [touch(1, 100, 110)], PHONE, SHEET);
  const added = updateGesture(dragged.session, [touch(1, 100, 110), touch(2, 200, 210)], PHONE, SHEET);
  assert.deepEqual(added.transform, dragged.transform);
  const replaced = updateGesture(added.session, [touch(1, 100, 110), touch(3, 330, 450)], PHONE, SHEET);
  assert.deepEqual(replaced.transform, added.transform);
  assert.deepEqual(replaced.session.identifiers, [1, 3]);
  const stationary = updateGesture(replaced.session, [touch(3, 330, 450), touch(1, 100, 110)], PHONE, SHEET);
  assert.deepEqual(stationary.transform, replaced.transform);
});

test('pinch zoom caps the scale before computing the focal offset', () => {
  const initial = { scale: 1, x: -180, y: -280 };
  const session = beginGesture([touch(1, 160, 230), touch(2, 200, 230)], initial);
  const result = updateGesture(session, [touch(1, 10, 230), touch(2, 350, 230)], PHONE, SHEET);
  const expected = zoomAt(initial, getZoomBounds(PHONE, SHEET).maxScale, { x: 180, y: 230 }, PHONE, SHEET);
  assert.deepEqual(result.transform, expected);
});

test('one-finger drags clamp at edges and full-sheet overview cannot be displaced', () => {
  const dragged = updateGesture(beginGesture([touch(4, 100, 100)], { scale: 1, x: -50, y: -50 }), [touch(4, 300, 300)], PHONE, SHEET);
  assert.deepEqual(dragged.transform, { scale: 1, x: 0, y: 0 });
  const fit = clampTransform({ scale: getZoomBounds(PHONE, SHEET).minScale }, PHONE, SHEET);
  const shifted = updateGesture(beginGesture([touch(4, 100, 100)], fit), [touch(4, 0, 0)], PHONE, SHEET);
  assert.deepEqual(shifted.transform, fit);
});

test('coincident fingers establish a usable baseline without division by zero', () => {
  const initial = { scale: 1, x: -100, y: -150 };
  const session = beginGesture([touch(1, 150, 200), touch(2, 150, 200)], initial);
  const separated = updateGesture(session, [touch(1, 120, 200), touch(2, 180, 200)], PHONE, SHEET);
  assert.deepEqual(separated.transform, initial);
  const result = updateGesture(separated.session, [touch(1, 100, 200), touch(2, 200, 200)], PHONE, SHEET);
  near(result.transform.scale, 5 / 3);
  assert.ok(Object.values(result.transform).every(Number.isFinite));
});
