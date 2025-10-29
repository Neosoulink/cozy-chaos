import { AppModule } from "@quick-threejs/reactive/worker";
import {
	AmbientLight,
	CanvasTexture,
	Color,
	ColorManagement,
	DirectionalLight,
	DoubleSide,
	HemisphereLight,
	LinearFilter,
	LinearMipMapLinearFilter,
	MeshStandardMaterial,
	PointLight,
	RepeatWrapping,
	SRGBColorSpace,
	Texture,
	UVMapping,
} from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { DEFAULT_RENDERER_CONFIG } from "@/shared/constants/renderer.constant";
import { createSnowflakeShader } from "@/shared/utils/snowflake-shader.util";
import { GLTF } from "three/examples/jsm/Addons.js";

@scoped(Lifecycle.ContainerScoped)
export class WorldService {
	static readonly DEFAULT_AMBIENT_LIGHT_INTENSITY = 0.4;
	static readonly DEFAULT_DIRECTIONAL_LIGHT_INTENSITY = 1.5;
	static readonly DEFAULT_HEMISPHERE_LIGHT_INTENSITY = 1.7;
	static readonly DEFAULT_CEILING_LIGHT_INTENSITY = 0.5;

	public defaultAmbientLight?: AmbientLight;
	public defaultDirectionalLight?: DirectionalLight;
	public defaultHemisphereLight?: HemisphereLight;
	public defaultMaterial?: MeshStandardMaterial;
	public defaultEmissiveMaterial?: MeshStandardMaterial;
	public snowflakeEffect?: ReturnType<typeof createSnowflakeShader>;

	public ceilingLights: PointLight[] = [];
	public isIndoorLightingEnabled = true;
	public textures: {
		defaultAlbedoTexture?: CanvasTexture;
		defaultEmissionTexture?: CanvasTexture;
		fireTexture?: CanvasTexture;
		snowflakeTexture?: CanvasTexture;
		lightingTexture?: CanvasTexture;
		door1OutsideTexture?: CanvasTexture;
		door2OutsideTexture?: CanvasTexture;
		windowOutsideTexture?: CanvasTexture;
		tvScreenTexture?: CanvasTexture;
		tvScreenBrokenTexture?: CanvasTexture;
	} = {};

	constructor(@inject(AppModule) private readonly _app: AppModule) {}

	private _correctTexture(texture: Texture): void {
		texture.colorSpace = SRGBColorSpace;
		texture.flipY = false;
		texture.mapping = UVMapping;
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		texture.repeat.set(1, 1);
		texture.anisotropy = 16;
		texture.minFilter = LinearMipMapLinearFilter;
		texture.magFilter = LinearFilter;
	}

	public init(): void {
		const resources = this._app.loader.getLoadedResources();
		this.textures.defaultAlbedoTexture = new CanvasTexture(
			resources["default-albedo"] as ImageBitmap | undefined
		);
		this.textures.defaultEmissionTexture = new CanvasTexture(
			resources["default-emission"] as ImageBitmap | undefined
		);
		this.textures.fireTexture = new CanvasTexture(
			resources["fire-sprite"] as ImageBitmap | undefined
		);
		this.textures.snowflakeTexture = new CanvasTexture(
			resources["snowflake-sprite"] as ImageBitmap | undefined
		);
		this.textures.lightingTexture = new CanvasTexture(
			resources["lighting-sprite"] as ImageBitmap | undefined
		);
		this.textures.door1OutsideTexture = new CanvasTexture(
			resources["door-1-outside"] as ImageBitmap | undefined
		);
		this.textures.door2OutsideTexture = new CanvasTexture(
			resources["door-2-outside"] as ImageBitmap | undefined
		);
		this.textures.windowOutsideTexture = new CanvasTexture(
			resources["window-outside"] as ImageBitmap | undefined
		);
		this.textures.tvScreenTexture = new CanvasTexture(
			resources["tv-screen"] as ImageBitmap | undefined
		);
		this.textures.tvScreenBrokenTexture = new CanvasTexture(
			resources["tv-screen-broken"] as ImageBitmap | undefined
		);

		this._correctTexture(this.textures.defaultAlbedoTexture);
		this._correctTexture(this.textures.defaultEmissionTexture);
		this._correctTexture(this.textures.fireTexture);
		this._correctTexture(this.textures.snowflakeTexture);
		this._correctTexture(this.textures.lightingTexture);
		this._correctTexture(this.textures.door1OutsideTexture);
		this._correctTexture(this.textures.door2OutsideTexture);
		this._correctTexture(this.textures.windowOutsideTexture);
		this._correctTexture(this.textures.tvScreenTexture);
		this._correctTexture(this.textures.tvScreenBrokenTexture);

		this.defaultAmbientLight = new AmbientLight(
			0xfff4e6,
			WorldService.DEFAULT_AMBIENT_LIGHT_INTENSITY
		);
		this.defaultDirectionalLight = new DirectionalLight(
			0xffffff,
			WorldService.DEFAULT_DIRECTIONAL_LIGHT_INTENSITY
		);
		this.defaultDirectionalLight.color.setHSL(0.1, 0.3, 0.8);
		this.defaultDirectionalLight.castShadow = true;
		this.defaultDirectionalLight.shadow.mapSize.set(512, 512);
		this.defaultDirectionalLight.shadow.camera.near = 0.1;
		this.defaultDirectionalLight.shadow.camera.far = 50;
		this.defaultDirectionalLight.shadow.camera.left = -10;
		this.defaultDirectionalLight.shadow.camera.right = 10;
		this.defaultDirectionalLight.shadow.camera.top = 10;
		this.defaultDirectionalLight.shadow.camera.bottom = -10;

		this.defaultHemisphereLight = new HemisphereLight(
			0xfff4e6,
			0x8b7355,
			WorldService.DEFAULT_HEMISPHERE_LIGHT_INTENSITY
		);
		this.defaultHemisphereLight.position.set(0, 3, 0);

		this.createIndoorLighting();

		this.snowflakeEffect = createSnowflakeShader(
			this.textures.snowflakeTexture
		);

		this.defaultMaterial = new MeshStandardMaterial({
			color: new Color(0xffd2a9),
			map: this.textures.defaultAlbedoTexture,
			emissive: new Color(0xffffffff),
			emissiveMap: this.textures.defaultEmissionTexture,
			emissiveIntensity: 100,
			roughness: 0.9,
			side: DoubleSide,
		});

		this.defaultEmissiveMaterial = this.defaultMaterial.clone();

		this.reset();
		const lights = [
			this.defaultAmbientLight,
			this.defaultDirectionalLight,
			this.defaultHemisphereLight,
			...this.ceilingLights,
		].filter(
			(light): light is NonNullable<typeof light> => light !== undefined
		);

		this._app.world.scene().add(...lights);
	}

	private createIndoorLighting(): void {
		const resources = this._app.loader.getLoadedResources()["home"] as
			| GLTF
			| undefined;
		const homeScene = resources?.scene;
		const lightPositions =
			homeScene?.children
				.filter((child) => child.name.startsWith("Roof-lights"))
				?.map((child) => child.position.clone().add({ x: 0, y: -0.1, z: 0 })) ||
			[];

		lightPositions.forEach((position) => {
			const ceilingLight = new PointLight(
				0xfff4e6,
				WorldService.DEFAULT_CEILING_LIGHT_INTENSITY,
				8
			);
			ceilingLight.position.set(position.x, position.y, position.z);
			ceilingLight.castShadow = true;
			ceilingLight.shadow.mapSize.set(512, 512);
			ceilingLight.shadow.camera.near = 0.1;
			ceilingLight.shadow.camera.far = 12;
			ceilingLight.shadow.bias = -0.0001;

			this.ceilingLights.push(ceilingLight);
		});
	}

	public toggleIndoorLighting(enabled: boolean): void {
		this.isIndoorLightingEnabled = enabled;

		this.ceilingLights.forEach((light) => {
			light.intensity = enabled
				? WorldService.DEFAULT_AMBIENT_LIGHT_INTENSITY
				: 0;
		});
		if (this.defaultAmbientLight)
			this.defaultAmbientLight.intensity = enabled
				? WorldService.DEFAULT_AMBIENT_LIGHT_INTENSITY
				: 0.3;
		if (this.defaultDirectionalLight)
			this.defaultDirectionalLight.intensity = enabled
				? WorldService.DEFAULT_DIRECTIONAL_LIGHT_INTENSITY
				: 0.3;
		if (this.defaultHemisphereLight)
			this.defaultHemisphereLight.intensity = enabled
				? WorldService.DEFAULT_HEMISPHERE_LIGHT_INTENSITY
				: 0.3;
		if (this.defaultEmissiveMaterial)
			this.defaultEmissiveMaterial.emissiveIntensity = enabled ? 100 : 0;
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

	public update({ elapsed }: { elapsed: number }): void {
		this.snowflakeEffect?.step(elapsed);
	}

	public reset(): void {
		this.resetColorManagement();
		this.resetRenderer();
	}
}
