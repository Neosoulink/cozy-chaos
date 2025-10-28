// Original Author: @simondevyoutube | https://github.com/simondevyoutube
// Author: @bobbyroe | https://github.com/bobbyroe
// Source: https://github.com/bobbyroe/Simple-Particle-Effects

import {
	AdditiveBlending,
	BufferGeometry,
	Camera,
	Color,
	Float32BufferAttribute,
	Points,
	ShaderMaterial,
	Texture,
	Vector3,
	Vector3Like,
} from "three";

const _VS = /* glsl */ `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 aColor;

varying vec4 vColor;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColor = aColor;
}`;

const _FS = /* glsl */ `
uniform sampler2D diffuseTexture;

varying vec4 vColor;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColor;
}`;

function getLinearSpline(lerp) {
	const points: [number, Color | number][] = [];
	const _lerp = lerp;

	function addPoint(t: number, d: Color | number) {
		points.push([t, d]);
	}

	function getValueAt(t: number) {
		let p1 = 0;

		for (let i = 0; i < points.length; i++) {
			if (points[i]![0] >= t) {
				break;
			}
			p1 = i;
		}

		const p2 = Math.min(points.length - 1, p1 + 1);

		if (p1 == p2) {
			return points[p1]![1];
		}

		return _lerp(
			(t - points[p1]![0]) / (points[p2]![0] - points[p1]![0]),
			points[p1]![1],
			points[p2]![1]
		);
	}
	return { addPoint, getValueAt };
}

export type ParticleSystemParams = {
	camera: Camera;
	emitterPosition: Vector3;
	texture: Texture;
	viewportHeight: number;
	splineColors?: [t: number, color: Color][];
	rate?: number;
	radius?: number;
	velocity?: Vector3Like;
	maxLife?: number;
	maxSize?: number;
};

export function createParticleSystem({
	camera,
	emitterPosition,
	texture,
	viewportHeight,
	splineColors = [[0.0, new Color(0xffffff)]],
	rate = 5,
	radius = 0.1,
	velocity = { x: 0, y: 1, z: 0 },
	maxLife = 0.5,
	maxSize = 1,
}: ParticleSystemParams) {
	const uniforms = {
		diffuseTexture: {
			value: texture,
		},
		pointMultiplier: {
			value: viewportHeight / (2.0 * Math.tan((30.0 * Math.PI) / 180.0)),
		},
	};
	const _material = new ShaderMaterial({
		uniforms: uniforms,
		vertexShader: _VS,
		fragmentShader: _FS,
		blending: AdditiveBlending,
		depthTest: true,
		depthWrite: false,
		transparent: true,
		vertexColors: true,
	});

	let _particles: {
		position: Vector3;
		size: number;
		geoColor: Color;
		alpha: number;
		life: number;
		maxLife: number;
		rotation: number;
		rotationRate: number;
		velocity: Vector3;
		currentSize?: number;
	}[] = [];

	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute([], 3));
	geometry.setAttribute("size", new Float32BufferAttribute([], 1));
	geometry.setAttribute("aColor", new Float32BufferAttribute([], 4));
	geometry.setAttribute("angle", new Float32BufferAttribute([], 1));

	const alphaSpline = getLinearSpline((t, a, b) => {
		return a + t * (b - a);
	});
	alphaSpline.addPoint(0.0, 0.0);
	alphaSpline.addPoint(0.6, 1.0);
	alphaSpline.addPoint(1.0, 0.0);

	const colorSpline = getLinearSpline((t: number, a: Color, b: Color) => {
		const c = a.clone();
		return c.lerp(b, t);
	});
	splineColors.forEach((colorParams) => {
		colorSpline.addPoint(...colorParams);
	});

	const sizeSpline = getLinearSpline((t: number, a: number, b: number) => {
		return a + t * (b - a);
	});
	sizeSpline.addPoint(0.0, 0.0);
	sizeSpline.addPoint(1.0, 1.0);

	let gdfsghk = 0.0;

	const points = new Points(geometry, _material);

	function _AddParticles(timeElapsed: number) {
		gdfsghk += timeElapsed;
		const n = Math.floor(gdfsghk * rate);
		gdfsghk -= n / rate;
		for (let i = 0; i < n; i += 1) {
			const life = (Math.random() * 0.75 + 0.25) * maxLife;
			_particles.push({
				position: new Vector3(
					(Math.random() * 2 - 1) * radius,
					(Math.random() * 2 - 1) * radius,
					(Math.random() * 2 - 1) * radius
				).add(emitterPosition),
				size: (Math.random() * 0.5 + 0.5) * maxSize,
				geoColor: new Color(),
				alpha: 1.0,
				life: life,
				maxLife: life,
				rotation: Math.random() * 2.0 * Math.PI,
				rotationRate: Math.random() * 0.01 - 0.005,
				velocity: new Vector3(velocity.x, velocity.y, velocity.z),
			});
		}
	}

	function _UpdateGeometry() {
		const positions: number[] = [];
		const sizes: number[] = [];
		const geoColors: number[] = [];
		const angles: number[] = [];

		for (let p of _particles) {
			positions.push(p.position.x, p.position.y, p.position.z);
			geoColors.push(p.geoColor.r, p.geoColor.g, p.geoColor.b, p.alpha);
			sizes.push(p.currentSize ?? 0);
			angles.push(p.rotation);
		}

		geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
		geometry.setAttribute("size", new Float32BufferAttribute(sizes, 1));
		geometry.setAttribute("aColor", new Float32BufferAttribute(geoColors, 4));
		geometry.setAttribute("angle", new Float32BufferAttribute(angles, 1));

		if (geometry.attributes.position)
			geometry.attributes.position.needsUpdate = true;
		if (geometry.attributes.size) geometry.attributes.size.needsUpdate = true;
		if (geometry.attributes.aColor)
			geometry.attributes.aColor.needsUpdate = true;
		if (geometry.attributes.angle) geometry.attributes.angle.needsUpdate = true;
	}

	function _UpdateParticles(timeElapsed: number) {
		for (let p of _particles) {
			p.life -= timeElapsed;
		}

		_particles = _particles.filter((p) => {
			return p.life > 0.0;
		});

		for (let p of _particles) {
			const t = 1.0 - p.life / p.maxLife;
			p.rotation += p.rotationRate;
			p.alpha = alphaSpline.getValueAt(t);
			p.currentSize = p.size * sizeSpline.getValueAt(t);
			p.geoColor.copy(colorSpline.getValueAt(t));

			p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));

			const drag = p.velocity.clone();
			drag.multiplyScalar(timeElapsed * 0.1);
			drag.x =
				Math.sign(p.velocity.x) *
				Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
			drag.y =
				Math.sign(p.velocity.y) *
				Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
			drag.z =
				Math.sign(p.velocity.z) *
				Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));
			p.velocity.sub(drag);
		}

		_particles.sort((a, b) => {
			const d1 = camera.position.distanceTo(a.position);
			const d2 = camera.position.distanceTo(b.position);

			if (d1 > d2) return -1;
			if (d1 < d2) return 1;
			return 0;
		});
	}

	function step(timeElapsed: number) {
		_AddParticles(timeElapsed);
		_UpdateParticles(timeElapsed);
		_UpdateGeometry();
	}

	function dispose() {
		points.removeFromParent();
		points.geometry.dispose();
		points.material.dispose();
		_particles = [];
	}

	_UpdateGeometry();

	return { step, points, dispose };
}
