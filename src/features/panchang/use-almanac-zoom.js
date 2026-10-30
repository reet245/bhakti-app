import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';
import zoomGeometry from './almanac-zoom.cjs';

const { getZoomBounds, getOverviewTransform, clampTransform, reframeTransform, beginGesture, updateGesture } = zoomGeometry;

export default function useAlmanacZoom({ width, height, resetKey }) {
  const viewportRef = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const geometry = useRef({ viewport: { width: 0, height: 0 }, sheet: { width, height }, transform: { scale: 1, x: 0, y: 0 }, resetKey });
  const gesture = useRef(null);
  const autoFit = useRef(true);
  const interacting = useRef(false);
  const suppressPressUntil = useRef(0);
  const [motion] = useState(() => ({ x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1) }));
  const [ready, setReady] = useState(false);

  const updateReadiness = useCallback(() => {
    const { viewport, sheet } = geometry.current;
    setReady(viewport.width > 2 && viewport.height > 2 && sheet.height > 0);
  }, []);

  const apply = useCallback((next) => {
    const { viewport, sheet } = geometry.current;
    const bounded = clampTransform(next, viewport, sheet);
    geometry.current.transform = bounded;
    // Gesture frames update just the native view; the calendar cells do not
    // re-render on every finger move. No timed animation competes with touch.
    motion.x.setValue(bounded.x);
    motion.y.setValue(bounded.y);
    motion.scale.setValue(bounded.scale);
  }, [motion]);

  const measureOrigin = useCallback(() => {
    viewportRef.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
  }, []);

  const onViewportLayout = useCallback(({ nativeEvent: { layout } }) => {
    const current = geometry.current;
    const viewport = { width: layout.width, height: layout.height };
    const next = autoFit.current
      ? getOverviewTransform(viewport, current.sheet)
      : reframeTransform(current.transform, current.viewport, viewport, current.sheet);
    current.viewport = viewport;
    gesture.current = null;
    interacting.current = false;
    apply(next);
    updateReadiness();
    measureOrigin();
  }, [apply, measureOrigin, updateReadiness]);

  useLayoutEffect(() => {
    const current = geometry.current;
    const reset = current.resetKey !== resetKey || current.sheet.height <= 0;
    if (reset) autoFit.current = true;
    current.sheet = { width, height };
    current.resetKey = resetKey;
    gesture.current = null;
    interacting.current = false;
    apply(autoFit.current ? getOverviewTransform(current.viewport, current.sheet) : current.transform);
    updateReadiness();
    measureOrigin();
  }, [width, height, resetKey, apply, measureOrigin, updateReadiness]);

  const localTouches = useCallback((event) => Array.from(event.nativeEvent.touches || []).map((touch) => ({
    identifier: touch.identifier,
    x: touch.pageX - origin.current.x,
    y: touch.pageY - origin.current.y,
  })), []);

  const panResponder = useMemo(() => {
    const begin = (event) => {
      autoFit.current = false;
      interacting.current = true;
      gesture.current = beginGesture(localTouches(event), geometry.current.transform);
    };
    const finish = () => {
      gesture.current = null;
      interacting.current = false;
      const { viewport, sheet, transform } = geometry.current;
      const { minScale } = getZoomBounds(viewport, sheet);
      // Pinching back to the overview restores automatic whole-page fitting
      // when the phone rotates or the available screen area changes.
      autoFit.current = Math.abs(transform.scale - minScale) <= minScale * 0.0001;
      // A lifted finger after a pinch/drag must not open the date underneath it.
      suppressPressUntil.current = Date.now() + 200;
    };
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: (event) => {
        measureOrigin();
        return event.nativeEvent.touches.length > 1;
      },
      onMoveShouldSetPanResponderCapture: (event, state) => event.nativeEvent.touches.length > 1 || Math.hypot(state.dx, state.dy) > 6,
      onPanResponderGrant: begin,
      onPanResponderStart: begin,
      onPanResponderMove: (event) => {
        const { viewport, sheet, transform } = geometry.current;
        const touches = localTouches(event);
        const next = updateGesture(gesture.current || beginGesture(touches, transform), touches, viewport, sheet);
        gesture.current = next.session;
        apply(next.transform);
      },
      // Re-anchor to the remaining finger, so lifting one finger cannot jump.
      onPanResponderEnd: (event) => { if (event.nativeEvent.touches.length) begin(event); },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    });
  }, [apply, localTouches, measureOrigin]);

  return {
    viewportRef, onViewportLayout, panHandlers: panResponder.panHandlers,
    ready,
    animatedStyle: { transform: [{ translateX: motion.x }, { translateY: motion.y }, { scale: motion.scale }], transformOrigin: 'top left' },
    canActivate: () => !interacting.current && Date.now() >= suppressPressUntil.current,
  };
}
