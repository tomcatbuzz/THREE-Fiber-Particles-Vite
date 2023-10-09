export default `
// varying vec2 vUv;
// uniform sampler2D t1;
uniform float uProgress;
// uniform sampler2D uCurrentPosition;
uniform sampler2D uOriginalPosition;
uniform vec3 uMouse;
uniform float uTime;
float PI = 3.141592653589793238;
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()	{
  vec2 vUv = gl_FragCoord.xy / resolution.xy;
  float offset = rand(vUv);

  // changing to 3D
  vec3 position = texture2D( uCurrentPosition, vUv ).xyz;
  vec3 original = texture2D( uOriginalPosition, vUv ).xyz;
  vec3 velocity = texture2D( uCurrentVelocity, vUv ).xyz;

  // 3D 
  // vec3 finalOriginal = original;

  velocity *= 0.9;

  // particle attraction to shape force 3D
  vec3 direction = normalize( original - position );
  float dist = length( original - position );
  if(dist > 0.01) {
    // can change end value 0.001 for different effect
    velocity += direction * 0.001;
  }

  // mouse repel force 3D
  float mouseDistance = distance( position, uMouse );
  float maxDistance = 0.6;
  if( mouseDistance < maxDistance ) {
    vec3 direction = normalize( position - uMouse );
    // can change end value 0.001 for different effect
    velocity += direction * (1.0 - mouseDistance / maxDistance ) * 0.01;
  }

  // lifespan of particles 3D
  float lifespan = 10.;
  float age = mod( uTime + lifespan*offset, lifespan );
  if( age < 0.1 ) {
    // velocity = vec2(0.0, 0.001);
    position.xyz = original;
  }

  gl_FragColor = vec4(velocity, 1.);
}`