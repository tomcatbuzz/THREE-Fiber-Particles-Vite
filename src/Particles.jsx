import './RenderMaterial';
import './SimulationMaterial';
import { getDataTexture, getSphereTexture, getVelocityTexture } from './GetDataTexture';
import { createPortal, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
// import { useFBO } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import simFragmentPosition from './shaders/simFragmentPosition';
import simFragmentVelocity from './shaders/simFragmentVelocity';


export function Particles() {
  const SIZE = 14;
  // might need to go into refs or state for r3f
  const simMat = useRef();
  const renderMat = useRef()
  const followMouse = useRef()
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
    
  const originalPosition = getDataTexture(SIZE)

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
    renderMat.current.uniforms.uPosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
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
        <meshBasicMaterial color="red" />
      </mesh>
      <points>
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
      </points>
    </>
    
  )
}
