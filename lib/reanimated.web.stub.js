/**
 * Web stub for react-native-reanimated + react-native-worklets.
 * Intercepts all imports of those packages on web (via metro.config.js resolver).
 * Provides non-animated, React-state-backed equivalents so every component
 * renders and responds to events correctly in the browser without native threads.
 */
const React = require('react');
const { View, Text, ScrollView, Image, FlatList } = require('react-native');

// ---------------------------------------------------------------------------
// useSharedValue — backed by useReducer so mutations trigger re-renders
// ---------------------------------------------------------------------------
function useSharedValue(init) {
  var ref = React.useRef(init);
  var rerender = React.useReducer(function (x) { return x + 1; }, 0)[1];
  return React.useMemo(function () {
    return {
      get value() { return ref.current; },
      set value(v) {
        ref.current = v;
        rerender();
      },
    };
  }, []);
}

// ---------------------------------------------------------------------------
// useAnimatedStyle — re-computes on every render.
// Handles both plain arrow functions AND Reanimated-Babel-transformed worklets
// (which reference this.__closure instead of the outer JS closure).
// ---------------------------------------------------------------------------
function useAnimatedStyle(fn) {
  try {
    if (typeof fn === 'function') {
      // Babel-transformed worklet: closure vars are in fn.__closure
      if (fn.__closure) {
        return fn.call({ __closure: fn.__closure });
      }
      return fn();
    }
    // Worklet descriptor object { _f, __closure, ... }
    if (fn && typeof fn._f === 'function') {
      return fn._f.call({ __closure: fn.__closure || {} });
    }
  } catch (_) {
    // Silently return empty style if worklet execution fails
  }
  return {};
}

// ---------------------------------------------------------------------------
// Animation drivers — return target value immediately (no animation on web)
// ---------------------------------------------------------------------------
function withTiming(toValue) { return toValue; }
function withSpring(toValue) { return toValue; }
function withDelay(_ms, value) { return value; }
function withSequence() {
  return arguments.length ? arguments[arguments.length - 1] : 0;
}
function withRepeat(value) { return value; }
function cancelAnimation() {}
function runOnJS(fn) { return fn; }
function runOnUI(fn) { return fn; }

var Easing = {
  linear:  function (t) { return t; },
  ease:    function (t) { return t; },
  quad:    function (t) { return t; },
  cubic:   function (t) { return t; },
  sin:     function (t) { return t; },
  circle:  function (t) { return t; },
  exp:     function (t) { return t; },
  bounce:  function (t) { return t; },
  in:      function () { return function (t) { return t; }; },
  out:     function () { return function (t) { return t; }; },
  inOut:   function () { return function (t) { return t; }; },
  back:    function () { return function (t) { return t; }; },
  elastic: function () { return function (t) { return t; }; },
  poly:    function () { return function (t) { return t; }; },
  bezier:  function () { return function (t) { return t; }; },
  bezierFn:function () { return function (t) { return t; }; },
  steps:   function () { return function (t) { return t; }; },
};

// ---------------------------------------------------------------------------
// Animated namespace — plain RN components (no native animation layer)
// ---------------------------------------------------------------------------
var Animated = {
  View:    View,
  Text:    Text,
  ScrollView: ScrollView,
  Image:   Image,
  FlatList: FlatList,
  createAnimatedComponent: function (Comp) { return Comp; },
};

// ---------------------------------------------------------------------------
// Exports — cover every named export the app uses
// ---------------------------------------------------------------------------
module.exports = Animated;                        // default (import Animated from ...)
module.exports.default           = Animated;
module.exports.useSharedValue    = useSharedValue;
module.exports.useAnimatedStyle  = useAnimatedStyle;
module.exports.withTiming        = withTiming;
module.exports.withSpring        = withSpring;
module.exports.withDelay         = withDelay;
module.exports.withSequence      = withSequence;
module.exports.withRepeat        = withRepeat;
module.exports.cancelAnimation   = cancelAnimation;
module.exports.runOnJS           = runOnJS;
module.exports.runOnUI           = runOnUI;
module.exports.Easing            = Easing;
// Worklets-specific no-ops (for react-native-worklets itself)
module.exports.WorkletsModule    = {};
module.exports.createWorkletRuntime = function () { return {}; };
module.exports.makeShareable     = function (v) { return v; };
module.exports.makeShareableCloneOnUIThread = function (v) { return v; };
