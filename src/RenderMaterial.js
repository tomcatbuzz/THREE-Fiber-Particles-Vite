import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const RenderMaterial = shaderMaterial(
  {
    uPosition: null
  },  
  // vertex shader
  `
  // varying vec2 vUv;
  attribute vec2 ref;
  varying vec2 vRef;
  uniform sampler2D uPosition;
    void main() {
      // vUv = uv;
      vRef = ref;
      vec3 pos = texture2D(uPosition, ref).rgb;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 5.0;
    }
  `
  ,
  // fragment shader
  
  `
  varying vec2 vRef;
    void main() {
      gl_FragColor.rgba = vec4(1., 1., 1., 1.0);
    }
  `
)

extend({ RenderMaterial })