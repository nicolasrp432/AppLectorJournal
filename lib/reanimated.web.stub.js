const React = require('react');
const { View, Text, ScrollView, Image, FlatList, StyleSheet } = require('react-native');

// ---------------------------------------------------------------------------
// useSharedValue — backed by useReducer so mutations trigger re-renders
// ---------------------------------------------------------------------------
function useSharedValue(init) {
  var ref = React.useRef(init);
  var rerender = React.useReducer(function (x) { return x + 1; }, 0)[1];
  var pending = React.useRef(false);
  return React.useMemo(function () {
    return {
      get value() { return ref.current; },
      set value(v) {
        if (ref.current !== v) {
          ref.current = v;
          if (!pending.current) {
            pending.current = true;
            Promise.resolve().then(function () {
              pending.current = false;
              rerender();
            });
          }
        }
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
// useAnimatedRef & useScrollViewOffset & useAnimatedProps shims for Web
// ---------------------------------------------------------------------------
function useAnimatedRef() {
  return React.useRef(null);
}

function useScrollViewOffset(aref) {
  return useSharedValue(0);
}

function useAnimatedProps(fn) {
  try {
    if (typeof fn === 'function') {
      if (fn.__closure) {
        return fn.call({ __closure: fn.__closure });
      }
      return fn();
    }
  } catch (_) {
    // Fallback
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

// ---------------------------------------------------------------------------
// interpolate — linear interpolation between numeric ranges
// ---------------------------------------------------------------------------
function interpolate(value, inputRange, outputRange, extrapolation) {
  if (!inputRange || !outputRange || inputRange.length < 2 || outputRange.length < 2) {
    return outputRange ? outputRange[0] || 0 : 0;
  }
  var minIn = inputRange[0], maxIn = inputRange[inputRange.length - 1];
  var clamped = Math.max(minIn, Math.min(maxIn, value));
  for (var i = 0; i < inputRange.length - 1; i++) {
    if (clamped >= inputRange[i] && clamped <= inputRange[i + 1]) {
      var t = (clamped - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      return outputRange[i] + t * (outputRange[i + 1] - outputRange[i]);
    }
  }
  return outputRange[outputRange.length - 1];
}

// ---------------------------------------------------------------------------
// interpolateColor — simple color interpolation (returns nearest color)
// ---------------------------------------------------------------------------
function interpolateColor(value, inputRange, outputRange) {
  if (!inputRange || !outputRange) return outputRange ? outputRange[0] : '#000';
  if (value <= inputRange[0]) return outputRange[0];
  if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
  for (var i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      var t = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      return t < 0.5 ? outputRange[i] : outputRange[i + 1];
    }
  }
  return outputRange[0];
}
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
// Layout & Entering/Exiting Dummy Animation Builders
// ---------------------------------------------------------------------------
var dummyAnimation = {
  delay: function() { return this; },
  duration: function() { return this; },
  springify: function() { return this; },
  damping: function() { return this; },
  mass: function() { return this; },
  stiffness: function() { return this; },
  overshootClamping: function() { return this; },
  restDisplacementThreshold: function() { return this; },
  restSpeedThreshold: function() { return this; },
  withCallback: function() { return this; },
};

// ---------------------------------------------------------------------------
// Animated namespace — plain RN components (no native animation layer)
// ---------------------------------------------------------------------------
function flattenStyle(s) {
  if (s == null) return s;
  if (Array.isArray(s)) return StyleSheet.flatten(s.filter(Boolean));
  return s;
}

function wrapComponent(Comp) {
  var wrapped = React.forwardRef(function(props, ref) {
    var flatStyle = flattenStyle(props.style);
    return React.createElement(Comp, Object.assign({}, props, { ref: ref, style: flatStyle }));
  });
  wrapped.displayName = 'Animated(' + (Comp.displayName || Comp.name || 'Component') + ')';
  return wrapped;
}

var Animated = {
  View:       wrapComponent(View),
  Text:       wrapComponent(Text),
  ScrollView: wrapComponent(ScrollView),
  Image:      wrapComponent(Image),
  FlatList:   wrapComponent(FlatList),
  createAnimatedComponent: function (Comp) { return wrapComponent(Comp); },
};

// ---------------------------------------------------------------------------
// Exports — cover every named export the app uses
// ---------------------------------------------------------------------------
module.exports = Animated;                        // default (import Animated from ...)
module.exports.default           = Animated;
module.exports.useSharedValue    = useSharedValue;
module.exports.useAnimatedStyle  = useAnimatedStyle;
module.exports.useAnimatedRef    = useAnimatedRef;
module.exports.useScrollViewOffset = useScrollViewOffset;
module.exports.useAnimatedProps  = useAnimatedProps;
module.exports.withTiming        = withTiming;
module.exports.withSpring        = withSpring;
module.exports.withDelay         = withDelay;
module.exports.withSequence      = withSequence;
module.exports.withRepeat        = withRepeat;
module.exports.cancelAnimation   = cancelAnimation;
module.exports.runOnJS           = runOnJS;
module.exports.runOnUI           = runOnUI;
module.exports.Easing            = Easing;
module.exports.interpolate       = interpolate;
module.exports.interpolateColor  = interpolateColor;

// Worklets-specific no-ops (for react-native-worklets itself)
module.exports.WorkletsModule    = {};
module.exports.createWorkletRuntime = function () { return {}; };
module.exports.makeShareable     = function (v) { return v; };
module.exports.makeShareableCloneOnUIThread = function (v) { return v; };

// Layout and entering/exiting animations mapping
module.exports.Layout            = dummyAnimation;
module.exports.FadeIn            = dummyAnimation;
module.exports.FadeInUp          = dummyAnimation;
module.exports.FadeInDown        = dummyAnimation;
module.exports.FadeInLeft        = dummyAnimation;
module.exports.FadeInRight       = dummyAnimation;
module.exports.FadeOut           = dummyAnimation;
module.exports.FadeOutUp         = dummyAnimation;
module.exports.FadeOutDown       = dummyAnimation;
module.exports.FadeOutLeft       = dummyAnimation;
module.exports.FadeOutRight      = dummyAnimation;
module.exports.ZoomIn            = dummyAnimation;
module.exports.ZoomInUp          = dummyAnimation;
module.exports.ZoomInDown        = dummyAnimation;
module.exports.ZoomInLeft        = dummyAnimation;
module.exports.ZoomInRight       = dummyAnimation;
module.exports.ZoomOut           = dummyAnimation;
module.exports.ZoomOutUp         = dummyAnimation;
module.exports.ZoomOutDown       = dummyAnimation;
module.exports.ZoomOutLeft       = dummyAnimation;
module.exports.ZoomOutRight      = dummyAnimation;
module.exports.SlideInUp         = dummyAnimation;
module.exports.SlideInDown       = dummyAnimation;
module.exports.SlideInLeft       = dummyAnimation;
module.exports.SlideInRight      = dummyAnimation;
module.exports.SlideOutUp        = dummyAnimation;
module.exports.SlideOutDown      = dummyAnimation;
module.exports.SlideOutLeft      = dummyAnimation;
module.exports.SlideOutRight     = dummyAnimation;
module.exports.BounceIn          = dummyAnimation;
module.exports.BounceInUp        = dummyAnimation;
module.exports.BounceInDown      = dummyAnimation;
module.exports.BounceInLeft      = dummyAnimation;
module.exports.BounceInRight     = dummyAnimation;
module.exports.BounceOut         = dummyAnimation;
module.exports.BounceOutUp       = dummyAnimation;
module.exports.BounceOutDown     = dummyAnimation;
module.exports.BounceOutLeft     = dummyAnimation;
module.exports.BounceOutRight    = dummyAnimation;
