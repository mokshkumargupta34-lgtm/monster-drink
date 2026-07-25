import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { cn } from '../../lib/utils';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uDetail;
  uniform float uDistortion;
  uniform float uBrightness;
  varying vec2 vUv;

  #define time uTime * 0.2

  mat2 makem2(in float theta){
      float c = cos(theta);
      float s = sin(theta);
      return mat2(c,-s,s,c);
  }

  float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise( in vec2 x, float detail ){
      x *= detail;
      vec2 p = floor(x);
      vec2 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(p + vec2(0.0, 0.0));
      float b = hash(p + vec2(1.0, 0.0));
      float c = hash(p + vec2(0.0, 1.0));
      float d = hash(p + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  mat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );

  float fbm( in vec2 p, float detail, int octaves )
  {
      float z=2.;
      float rz = 0.;
      for (int i= 0; i < 7; i++ )
      {
          if(i >= octaves) break;
          rz += abs((noise(p, detail)-0.5)*4.)/z;
          z = z*2.;
          p = p*2.;
          p *= m2;
      }
      return rz;
  }

 void main() {
    vec2 p = vUv * 2.0 - 1.0;
    p.x *= uResolution.x/uResolution.y;
    vec2 bp = p;
    p += 5.;
    p *= 0.5;

    float rb = fbm(p*.5 + time*.17, uDetail, 3) * .1;
    p *= makem2(rb*.2 + atan(p.y,p.x) * uDistortion);

    float rz = fbm(p*.9 - time*.7, uDetail, 5);

    rz *= 12.0;

    rz *= abs(sin(bp.x*0.5 - time*4.0 - 2.0)) * 1.0;

    vec3 col = uColor / (uBrightness - rz);

    gl_FragColor = vec4(sqrt(abs(col)), 1.0);
}
`;

interface ElectricMistProps {
  className?: string;
  speed?: number;
  color?: string;
  detail?: number;
  distortion?: number;
  brightness?: number;
  /**
   * Stops the render loop. The shader redraws every frame at full viewport
   * size, so anything that keeps it mounted while off screen — a pinned or
   * faded-out section, say — should pause it rather than pay for it.
   */
  paused?: boolean;
}

const Effect = ({
  speed,
  color,
  detail,
  distortion,
  brightness,
}: Required<Omit<ElectricMistProps, 'className' | 'paused'>>) => {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(color) },
      uSpeed: { value: speed },
      uDetail: { value: detail },
      uDistortion: { value: distortion },
      uBrightness: { value: brightness },
    }),
    [],
  );

  // Colour is eased toward rather than assigned: this fills the viewport, and
  // snapping it on a prop change reads as a flash. The rest apply immediately.
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    if (material.current) {
      material.current.uniforms.uSpeed.value = speed;
      material.current.uniforms.uDetail.value = detail;
      material.current.uniforms.uDistortion.value = distortion;
      material.current.uniforms.uBrightness.value = brightness;
    }
  }, [speed, detail, distortion, brightness]);

  useFrame((state, delta) => {
    if (material.current) {
      material.current.uniforms.uTime.value =
        state.clock.getElapsedTime() * speed;
      material.current.uniforms.uResolution.value.set(
        state.size.width,
        state.size.height,
      );
      // Framerate-independent ease, clamped so a long delta (tab restored, or
      // the loop resuming after a pause) cannot overshoot past the target.
      material.current.uniforms.uColor.value.lerp(
        targetColor,
        Math.min(1, delta * 3),
      );
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default function ElectricMist({
  className,
  speed = 1.0,
  color = '#191970',
  detail = 1.5,
  distortion = 3.0,
  brightness = 1.0,
  paused = false,
}: ElectricMistProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full pointer-events-none bg-[#05050f] overflow-hidden',
        className,
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={1}
        frameloop={paused ? 'never' : 'always'}
        // R3F sets pointer-events on its own container so the scene can receive
        // events, and that BEATS the pointer-events-none on the wrapper above —
        // a descendant re-enabling hit-testing is exactly what the cascade
        // allows. This background is decorative, and left alone it sits over the
        // whole section eating clicks meant for what is drawn in front of it.
        style={{ pointerEvents: 'none' }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Effect
          speed={speed}
          color={color}
          detail={detail}
          distortion={distortion}
          brightness={brightness}
        />
      </Canvas>
    </div>
  );
}
