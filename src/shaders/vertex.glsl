varying vec2 vUv;
attribute vec2 ref;
varying vec2 vRef;
  void main() {
    // vUv = uv;
    vRef = ref;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 5.0;
  }