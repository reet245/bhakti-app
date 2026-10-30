const ROUNDING_GUTTER = 2;
const MAX_WIDTH_ZOOM = 4;
const OVERVIEW_RELATIVE_TOLERANCE = 0.0001;

function size(value) {
  return {
    width: Number.isFinite(value?.width) && value.width > 0 ? value.width : 0,
    height: Number.isFinite(value?.height) && value.height > 0 ? value.height : 0,
  };
}

function measured(viewport, sheet) {
  return viewport.width > ROUNDING_GUTTER && viewport.height > ROUNDING_GUTTER
    && sheet.width > 0 && sheet.height > 0;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function getZoomBounds(viewport, sheet) {
  const view = size(viewport);
  const content = size(sheet);
  // Layout arrives asynchronously. A neutral transform avoids NaN/Infinity
  // reaching the native view while either measurement is unavailable.
  if (!measured(view, content)) return { minScale: 1, widthScale: 1, maxScale: MAX_WIDTH_ZOOM };
  const widthScale = (view.width - ROUNDING_GUTTER) / content.width;
  const minScale = Math.min(widthScale, (view.height - ROUNDING_GUTTER) / content.height);
  return { minScale, widthScale, maxScale: widthScale * MAX_WIDTH_ZOOM };
}

function clampTransform(transform, viewport, sheet) {
  const view = size(viewport);
  const content = size(sheet);
  if (!measured(view, content)) return { scale: 1, x: 0, y: 0 };
  const bounds = getZoomBounds(view, content);
  const scale = clamp(Number.isFinite(transform?.scale) ? transform.scale : bounds.minScale, bounds.minScale, bounds.maxScale);
  const width = content.width * scale;
  const height = content.height * scale;
  return {
    scale,
    x: width <= view.width ? (view.width - width) / 2
      : clamp(Number.isFinite(transform?.x) ? transform.x : 0, view.width - width, 0),
    y: height <= view.height ? 0
      : clamp(Number.isFinite(transform?.y) ? transform.y : 0, view.height - height, 0),
  };
}

function getOverviewTransform(viewport, sheet) {
  return clampTransform({ scale: getZoomBounds(viewport, sheet).minScale, x: 0, y: 0 }, viewport, sheet);
}

function zoomAt(transform, nextScale, anchor, viewport, sheet) {
  const current = clampTransform(transform, viewport, sheet);
  const view = size(viewport);
  const content = size(sheet);
  if (!measured(view, content)) return current;
  const bounds = getZoomBounds(view, content);
  const scale = clamp(Number.isFinite(nextScale) ? nextScale : current.scale, bounds.minScale, bounds.maxScale);
  const point = {
    x: Number.isFinite(anchor?.x) ? anchor.x : view.width / 2,
    y: Number.isFinite(anchor?.y) ? anchor.y : view.height / 2,
  };
  const ratio = scale / current.scale;
  return clampTransform({
    scale,
    x: point.x - (point.x - current.x) * ratio,
    y: point.y - (point.y - current.y) * ratio,
  }, view, content);
}

function reframeTransform(transform, oldViewport, newViewport, sheet) {
  const oldView = size(oldViewport);
  const newView = size(newViewport);
  const content = size(sheet);
  const nextBounds = getZoomBounds(newView, content);
  if (!measured(oldView, content) || !measured(newView, content)) {
    return getOverviewTransform(newView, content);
  }
  const current = clampTransform(transform, oldView, content);
  const oldBounds = getZoomBounds(oldView, content);
  // A complete overview stays complete when the available phone area changes.
  // Treat tiny float/gesture rounding near the minimum as the same overview.
  if (current.scale <= oldBounds.minScale * (1 + OVERVIEW_RELATIVE_TOLERANCE)) {
    return getOverviewTransform(newView, content);
  }
  const scale = clamp(current.scale / oldBounds.widthScale * nextBounds.widthScale, nextBounds.minScale, nextBounds.maxScale);
  // Keep the same sheet point under the center after rotation, subject to the
  // new viewport's edges. This preserves the reader's place while zoomed in.
  const contentX = (oldView.width / 2 - current.x) / current.scale;
  const contentY = (oldView.height / 2 - current.y) / current.scale;
  return clampTransform({
    scale,
    x: newView.width / 2 - contentX * scale,
    y: newView.height / 2 - contentY * scale,
  }, newView, content);
}

function touchPoints(touches) {
  // Stable identifiers let a lifted/replaced finger start a new baseline instead
  // of unexpectedly turning a continuing gesture into a large pan or pinch.
  return (Array.isArray(touches) ? touches : [])
    .filter((touch) => Number.isFinite(touch?.x) && Number.isFinite(touch?.y))
    .map((touch, index) => ({ identifier: touch.identifier ?? index, x: touch.x, y: touch.y }))
    .sort((a, b) => String(a.identifier).localeCompare(String(b.identifier)))
    .slice(0, 2);
}

function touchGeometry(points) {
  if (!points.length) return { centroid: null, distance: 0, identifiers: [] };
  const second = points[1] || points[0];
  return {
    centroid: { x: (points[0].x + second.x) / 2, y: (points[0].y + second.y) / 2 },
    distance: Math.hypot(second.x - points[0].x, second.y - points[0].y),
    identifiers: points.map((point) => point.identifier),
  };
}

function beginGesture(touches, transform) {
  const current = {
    scale: Number.isFinite(transform?.scale) && transform.scale > 0 ? transform.scale : 1,
    x: Number.isFinite(transform?.x) ? transform.x : 0,
    y: Number.isFinite(transform?.y) ? transform.y : 0,
  };
  return { initial: { ...current }, transform: current, ...touchGeometry(touchPoints(touches)) };
}

function updateGesture(session, touches, viewport, sheet) {
  const points = touchPoints(touches);
  const next = touchGeometry(points);
  const current = clampTransform(session?.transform, viewport, sheet);
  const sameFingers = session?.identifiers?.length === next.identifiers.length
    && next.identifiers.every((identifier, index) => identifier === session.identifiers[index]);
  if (!sameFingers || !next.centroid || !session.centroid
      || (points.length === 2 && session.distance < 0.001)) {
    return { session: beginGesture(points, current), transform: current };
  }

  const initial = session.initial;
  const bounds = getZoomBounds(viewport, sheet);
  const scale = points.length === 2
    ? clamp(initial.scale * next.distance / session.distance, bounds.minScale, bounds.maxScale)
    : initial.scale;
  // Scale around the starting centroid and translate to the current centroid in
  // the same step. Clamping the scale first avoids focal drift at the zoom cap.
  const ratio = scale / initial.scale;
  const transform = clampTransform({
    scale,
    x: next.centroid.x - (session.centroid.x - initial.x) * ratio,
    y: next.centroid.y - (session.centroid.y - initial.y) * ratio,
  }, viewport, sheet);
  return { session: { ...session, transform }, transform };
}

module.exports = { getZoomBounds, getOverviewTransform, clampTransform, zoomAt, reframeTransform, beginGesture, updateGesture };
