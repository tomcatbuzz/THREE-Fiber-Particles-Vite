import './RenderMaterial';
import './SimulationMaterial';
import { getDataTexture, getSphereTexture, getVelocityTexture } from './GetDataTexture';
import { createPortal, useFrame, useLoader } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { MeshPhysicalMaterial, MeshMatcapMaterial } from 'three';
// import { useFBO } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import CustomShaderMaterial from 'three-custom-shader-material';
import { patchShaders } from 'gl-noise/build/glNoise.m';

import simFragmentPosition from './shaders/simFragmentPosition';
import simFragmentVelocity from './shaders/simFragmentVelocity';

// Rendering Shader
const shader = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform sampler2D uPosition;
    uniform sampler2D uVelocity;
    attribute vec2 ref;

    vec3 rotate3D(vec3 v, vec3 vel) {
      vec3 newpos = v;
      vec3 up = vec3(0, 1, 0);
      vec3 axis = normalize(cross(up, vel));
      float angle = acos(dot(up, normalize(vel)));
      newpos = newpos * cos(angle) + cross(axis, newpos) * sin(angle) + axis * dot(axis, newpos) * (1. - cos(angle));
      return newpos;
    }

    vec3 displace(vec3 point, vec3 vel) {
      vec3 pos = texture2D(uPosition, ref).rgb;
      vec3 copypoint = rotate3D(point, vel);
      vec3 instancePosition = (instanceMatrix * vec4(copypoint, 1.)).xyz;
      return instancePosition + pos;
    }  

    void main() {
      vec3 vel = texture2D(uVelocity, ref).rgb;
      vec3 p = displace(position, vel);
      csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);
      csm_Normal = rotate3D(normal, vel);
    }
    `,
  fragment: /* glsl */ `
    void main() {
      csm_DiffuseColor = vec4(1.);
    }
    `,
}

export function Particles() {
  const SIZE = 256;
  const [map] = useLoader(THREE.TextureLoader,['/matcap3.png'])
  // might need to go into refs or state for r3f
  const simMat = useRef();
  const renderMat = useRef()
  const followMouse = useRef()
  const iref = useRef()
  const { gl, viewport } = useThree()

  const gpuCompute = new GPUComputationRenderer( SIZE, SIZE, gl );

    // if ( renderer.capabilities.isWebGL2 === false ) {
    //   gpuCompute.setDataType( THREE.HalfFloatType );
    // }

    // this.pointsOnSphere = this.getPointsOnSphere();
    // this.velocityOnSphere = this.getVelocityOnSphere();

    // sphere
    const pointsOnSphere = getSphereTexture(SIZE);

    const positionVariable = gpuCompute.addVariable( 'uCurrentPosition', simFragmentPosition, pointsOnSphere );
    const velocityVariable = gpuCompute.addVariable( 'uCurrentVelocity', simFragmentVelocity, getVelocityTexture(SIZE) );

    gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
    gpuCompute.setVariableDependencies( velocityVariable, [ velocityVariable, positionVariable ] );
    
		const positionUniforms = positionVariable.material.uniforms;
    const velocityUniforms = velocityVariable.material.uniforms;

    velocityUniforms.uMouse = { value: new THREE.Vector3(0, 0, 0) };
    positionUniforms.uOriginalPosition = { value: pointsOnSphere };
    velocityUniforms.uOriginalPosition = { value: pointsOnSphere };

    gpuCompute.init()

  const particles = new Float32Array(SIZE * SIZE * 3);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const k = i * SIZE + j;
      particles[k * 3 + 0] = (5 * i) / SIZE;
      particles[k * 3 + 1] = (5 * j) / SIZE;
      particles[k * 3 + 2] = 0;
    }
  }

  const ref = new Float32Array(SIZE * SIZE * 2);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const k = i * SIZE + j;
      ref[k * 2 + 0] = i / (SIZE - 1);
      ref[k * 2 + 1] = j / (SIZE - 1);
    }
  }
  // original FBO custom code
  // const scene = new THREE.Scene
  // const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
  // let target0 = useFBO(SIZE, SIZE, {
  //   magFilter: THREE.NearestFilter,
  //   minFilter: THREE.NearestFilter,
  //   type: THREE.FloatType
  // });
  // let target1 = useFBO(SIZE, SIZE, {
  //   magFilter: THREE.NearestFilter,
  //   minFilter: THREE.NearestFilter,
  //   type: THREE.FloatType
  // });
  // const originalPosition = getDataTexture(SIZE)

  const uniforms = useMemo(
    () => ({
      uPosition: {
        value: null,
      },
      uVelocity: {
        value: null
      }
    }),
    []
  )

  useEffect(() => {
    const ref = new Float32Array(SIZE * SIZE * 2);
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
        const k = i * SIZE + j;
        ref[k * 2 + 0] = i / (SIZE - 1);
        ref[k * 2 + 1] = j / (SIZE - 1);
        }
      }
      iref.current.geometry.setAttribute('ref', new THREE.InstancedBufferAttribute(ref, 2))
  },[])

  useFrame(({ mouse }) => {
    followMouse.current.position.x = mouse.x * viewport.width/2;
    followMouse.current.position.y = mouse.y * viewport.height/2;
    // original FBO code for simulaton material
    // simMat.current.uniforms.uMouse.value.x = mouse.x * viewport.width/2;
    // simMat.current.uniforms.uMouse.value.y = mouse.y * viewport.height/2;

    velocityUniforms.uMouse.value.x = (mouse.x * viewport.width) / 2;
    velocityUniforms.uMouse.value.y = (mouse.y * viewport.height) / 2;
  })

  useFrame(({ gl }) => {
    gpuCompute.compute();
    // renderMat.current.uniforms.uPosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;

    iref.current.material.uniforms.uPosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;

    iref.current.material.uniforms.uVelocity.value = gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
    // original FBO custom code
    // gl.setRenderTarget(target0);
    // gl.render(scene, camera);
    // gl.setRenderTarget(null);
    // renderMat.current.uniforms.uPosition.value = target1.texture;
    // simMat.current.uniforms.uPosition.value = target0.texture;

    // let temp = target0;
    // target0 = target1;
    // target1 = temp;
  })
  return(
    <>
    {/* original code for FBO custom */}
    {/* {createPortal(
      <mesh>
        <planeGeometry args={[2, 2]} />
        <simulationMaterial 
          ref={simMat} 
          uPosition={originalPosition}
          uOriginalPosition={originalPosition} 
        />
      </mesh>,
      scene
    )} */}
      <mesh ref={followMouse}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshMatcapMaterial color="red" />
      </mesh>
      {/* <points>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            count ={particles.length / 3}
            array={particles}
            itemSize={3}
        />
        <bufferAttribute
            attach="attributes-ref"
            count ={ref.length / 3}
            array={ref}
            itemSize={2}
        />
      </bufferGeometry>
      <renderMaterial 
        transparent={true}
        blending={THREE.AdditiveBlending}
        ref={renderMat} 
      />
      </points> */}
      <instancedMesh ref={iref} args={[null, null, SIZE*SIZE]}>
        <boxGeometry args={[0.01, 0.03, 0.01]} />
        {/* <meshNormalMaterial /> */}
        <CustomShaderMaterial
          baseMaterial={MeshMatcapMaterial}
          size={0.01}
          matcap={map}
          vertexShader={patchShaders(shader.vertex)}
          fragmentShader={patchShaders(shader.fragment)}
          uniforms={uniforms}
          transparent
        />
      </instancedMesh>
    </>
    
  )
}
