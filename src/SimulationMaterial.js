import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const SimulationMaterial = shaderMaterial(
  {
    // could be put in uniforms?
    uPosition: null,
    uOriginalPosition: null, 
    uMouse: new THREE.Vector3(-10, -10, 10)
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
  uniform sampler2D uOriginalPosition;
  uniform vec3 uMouse;
    void main() {
      
      vec2 position = texture2D( uPosition, vUv ).xy;
      vec2 original = texture2D( uOriginalPosition, vUv ).xy;
      vec2 velocity = texture2D( uPosition, vUv ).zw;

      velocity *= 0.99;
      
      // particle attraction to shape force 3D
      vec2 direction = normalize( original - position );
      float dist = length( original - position );
      if(dist > 0.01) {
        // can change end value 0.001 for different effect
        velocity += direction * 0.0001;
      }

      // mouse repel force 3D
      float mouseDistance = distance( position, uMouse.xy );
      float maxDistance = 0.4;
      if( mouseDistance < maxDistance ) {
        vec2 direction = normalize( position - uMouse.xy );
        // can change end value 0.001 for different effect
        velocity += direction * (1.0 - mouseDistance / maxDistance ) * 0.01;
      }

      // lifespan of particles 3D
      // avoids the patterns in the canvas
      // float lifespan = 20.;
      // float age = mod( uTime + lifespan*offset, lifespan );
      // if( age < 0.1 ) {
      //   // velocity = vec2(0.0, 0.001);
      //   position.xyz = original;
      // }

      position.xy += velocity;

      gl_FragColor = vec4( position, velocity );
    }
  `
)

extend({ SimulationMaterial })