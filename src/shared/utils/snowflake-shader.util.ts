import { ShaderMaterial, Texture } from "three";

const vertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = `
	precision mediump float;
	varying vec2 vUv;
	uniform float time;
	uniform sampler2D flakeTex;

	float rand(float n) { return fract(sin(n) * 43758.5453123); }

	void main() {
		vec2 uv = vUv;
		vec4 color = vec4(0.0);
		const int NUM_FLAKES = 40;

		// Loop through snowflakes
		for (int i = 0; i < NUM_FLAKES; i++) {
			float fi = float(i);
			// Random position for each flake
			float x = rand(fi * 1.123);
			float yStart = rand(fi * 7.321);
			float size = 0.05 + rand(fi * 5.931) * 0.07;

			// Animate Y
			float y = mod(yStart - time * (0.15 + rand(fi * 3.77) * 0.25), 1.0);

			// Compute distance from this flake’s center
			vec2 pos = uv - vec2(x, y);

			// Sample snowflake texture
			vec2 flakeUV = pos / size + 0.5;
			if (all(greaterThanEqual(flakeUV, vec2(0.0))) && all(lessThanEqual(flakeUV, vec2(1.0)))) {
				vec4 tex = texture2D(flakeTex, flakeUV);
				color += tex * 0.8;
			}
		}

		// Output
		color = clamp(color, 0.0, 1.0);
		gl_FragColor = color;
	}
`;

export const createSnowflakeShader = (flakeTex: Texture) => {
	const uniforms = {
		time: { value: 0.0 },
		flakeTex: { value: flakeTex },
	};

	const material = new ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms,
		transparent: true,
	});

	function step(elapsedTime: number) {
		uniforms.time.value = elapsedTime;
		material.needsUpdate = true;
	}

	function dispose() {
		material.dispose();
	}

	return {
		uniforms,
		material,
		step,
		dispose,
	};
};
