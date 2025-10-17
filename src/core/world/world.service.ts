import { AppModule } from "@quick-threejs/reactive/worker";
import {
	AmbientLight,
	CanvasTexture,
	Color,
	ColorManagement,
	DirectionalLight,
	Material,
	MathUtils,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { DEFAULT_RENDERER_CONFIG } from "@/shared/constants/renderer.constant";
import { Sky } from "three/addons";

@scoped(Lifecycle.ContainerScoped)
export class WorldService {
	public defaultAmbientLight?: AmbientLight;
	public defaultDirectionalLight?: DirectionalLight;
	public defaultMaterial?: Material;
	public defaultSky?: Sky;

	constructor(@inject(AppModule) private readonly _app: AppModule) {}

	public init(): void {
		const resources = this._app.loader.getLoadedResources();
		const defaultAlbedoImg = resources["default-albedo"] as
			| ImageBitmap
			| undefined;
		const defaultEmissionImg = resources["default-emission"] as
			| ImageBitmap
			| undefined;
		const sun = new Vector3();
		const phi = MathUtils.degToRad(90 - 2);
		const theta = MathUtils.degToRad(180);

		this.defaultAmbientLight = new AmbientLight(0xffffff, 0.8);
		this.defaultDirectionalLight = new DirectionalLight(0xffffff, 1);
		this.defaultDirectionalLight.castShadow = true;
		this.defaultDirectionalLight.position.set(0, 3, 0);
		this.defaultMaterial = new MeshStandardMaterial({
			color: new Color(0xffd2a9),
			map: new CanvasTexture(defaultAlbedoImg),
			emissive: new Color(0xffffffff),
			emissiveMap: new CanvasTexture(defaultEmissionImg),
			emissiveIntensity: 100,
			roughness: 1,
		});

		this.defaultSky = new Sky();
		this.defaultSky.scale.setScalar(450000);

		const uniforms = this.defaultSky?.material.uniforms;
		if (uniforms?.["turbidity"]) uniforms["turbidity"].value = 10;
		if (uniforms?.["rayleigh"]) uniforms["rayleigh"].value = 2.5;
		if (uniforms?.["mieCoefficient"]) uniforms["mieCoefficient"].value = 0.005;
		if (uniforms?.["mieDirectionalG"]) uniforms["mieDirectionalG"].value = 0.8;
		if (uniforms?.["sunPosition"]) uniforms["sunPosition"].value = sun;
		sun.setFromSphericalCoords(1, phi, theta);
		if (uniforms["sunPosition"]) uniforms["sunPosition"].value.copy(sun);

		this.reset();
		this._app.world
			.scene()
			.add(
				this.defaultAmbientLight,
				this.defaultDirectionalLight,
				this.defaultSky
			);
	}

	public resetColorManagement(): void {
		ColorManagement.enabled = true;
	}

	public resetRenderer(): void {
		const renderer = this._app.renderer.instance();

		if (!renderer) return;

		renderer.autoClear = DEFAULT_RENDERER_CONFIG.autoClear;
		renderer.setClearColor(
			new Color(DEFAULT_RENDERER_CONFIG.clearColor),
			DEFAULT_RENDERER_CONFIG.clearAlpha
		);
		renderer.outputColorSpace = DEFAULT_RENDERER_CONFIG.outputColorSpace;
		renderer.toneMapping = DEFAULT_RENDERER_CONFIG.toneMapping;
		renderer.toneMappingExposure = DEFAULT_RENDERER_CONFIG.toneExposure;
	}

	public reset(): void {
		this.resetColorManagement();
		this.resetRenderer();
	}
}
