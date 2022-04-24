'use strict';

// Interpolate smoothly between start and stop.
// More info: https://en.wikipedia.org/wiki/Smoothstep
function smootherStep(start, stop, t) {
  t = constrain(t, 0, 1);
  t = -2 * t * t * t + 3 * t * t;
  return stop * t + start * (1 - t);
}

// Loop the value t between 0 and length.
function repeat(t, length) {
  return constrain(t - floor(t / length) * length, 0, length);
}

// Loop the value t between 0 and length, back and forth.
// Example:
// pingPong(2, 3) => 2
// pingPong(3, 3) => 3
// pingPong(4, 3) => 2
function pingPong(t, length) {
  t = repeat(t, length * 2);
  return length - abs(t - length);
}

function moveTowards(from, to, maxDelta) {
  if (abs(to - from) <= maxDelta) {
    return to;
  }
  return from + Math.sign(to - from) * maxDelta;
}
