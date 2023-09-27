import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

const SimulationMaterial = shaderMaterial(
  {
    // could be put in uniforms?
    uPosition: null,
    uVelocity: null
  },  
  // vertex shader
  `
  varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 5.0;
    }
  `
  ,
  // fragment shader
  
  `
  varying vec2 vUv;
  uniform sampler2D uPosition;
  uniform sampler2D uVelocity;
    void main() {
      vec3 position = texture2D(uPosition, vUv).rgb;
      vec3 velocity = texture2D(uVelocity, vUv).rgb;
      // position += velocity*0.01;
      // position.x += 0.01;
      gl_FragColor.rgba = vec4(position, 1.0);
    }
  `
)

extend({ SimulationMaterial })