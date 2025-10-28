import { AppModule } from "@quick-threejs/reactive/worker";
import {
	AmbientLight,
	CanvasTexture,
	Color,
	ColorManagement,
	DirectionalLight,
	HemisphereLight,
	LinearFilter,
	LinearMipMapLinearFilter,
	MeshStandardMaterial,
	RepeatWrapping,
	SRGBColorSpace,
	Texture,
	UVMapping,
} from "three";
import { inject, Lifecycle, scoped } from "tsyringe";

import { DEFAULT_RENDERER_CONFIG } from "@/shared/constants/renderer.constant";
import { createSnowflakeShader } from "@/shared/utils/snowflake-shader.util";

@scoped(Lifecycle.ContainerScoped)
export class WorldService {
	public defaultAmbientLight?: AmbientLight;
	public defaultDirectionalLight?: DirectionalLight;
	public defaultHemisphereLight?: HemisphereLight;
	public defaultMaterial?: MeshStandardMaterial;
	public snowflakeEffect?: ReturnType<typeof createSnowflakeShader>;
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

		this.defaultAmbientLight = new AmbientLight(0xffffff, 0.3);
		this.defaultDirectionalLight = new DirectionalLight(0xffffff, 3);
		this.defaultDirectionalLight.color.setHSL(0.1, 1, 0.95);
		this.defaultDirectionalLight.position.multiplyScalar(3);
		this.defaultDirectionalLight.position.set(0, 3, 0);
		this.defaultDirectionalLight.castShadow = true;
		this.defaultDirectionalLight.shadow.mapSize.set(256, 256);
		this.defaultHemisphereLight = new HemisphereLight(0xffffff, 0xffffff, 2);
		this.defaultHemisphereLight.color.setHSL(0.6, 1, 0.6);
		this.defaultHemisphereLight.groundColor.setHSL(0.095, 1, 0.75);
		this.defaultHemisphereLight.position.set(0, 3, 0);

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
			flatShading: true,
			// side: DoubleSide,
		});

		this.reset();
		this._app.world
			.scene()
			.add(
				this.defaultAmbientLight,
				this.defaultDirectionalLight,
				this.defaultHemisphereLight
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

	public update({ elapsed }: { elapsed: number }): void {
		this.snowflakeEffect?.step(elapsed);
	}

	public reset(): void {
		this.resetColorManagement();
		this.resetRenderer();
	}
}
