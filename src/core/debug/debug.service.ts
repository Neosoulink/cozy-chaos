import { AppModule } from "@quick-threejs/reactive/worker";
import {
	BufferGeometry,
	ColorManagement,
	DirectionalLightHelper,
	Line,
	LineBasicMaterial,
	Material,
	Mesh,
	MeshBasicMaterial,
	SphereGeometry,
	ToneMapping,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { inject, singleton } from "tsyringe";
import { WorldService } from "../world/world.service";
import { CharacterService } from "../character/character.service";
import { VECTOR_ZERO } from "@/shared/constants/common.constant";

@singleton()
export class DebugService {
	private readonly _renderer?: WebGLRenderer;
	private _directionalLightHelper?: DirectionalLightHelper;
	private _characterWalkingPathsLines: Record<string, Line> = {};
	private _characterLookAtIndicator?: Mesh;

	public enabled: boolean;

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _worldService: WorldService,
		@inject(CharacterService)
		private readonly _characterService: CharacterService
	) {
		this.enabled = this._app.debug.enabled();
		this._renderer = this._app.renderer.instance();
	}

	private _handleEnabledChange(enabled: boolean): void {
		this.enabled = enabled;
		this._app.debug._service.enabled = enabled;
		if (this._app.debug._service.cameraControls)
			this._app.debug._service.cameraControls.enabled = enabled;
		if (this._app.debug._service.miniCameraControls)
			this._app.debug._service.miniCameraControls.enabled = enabled;
		if (this._app.debug._service.gridHelper) {
			this._app.debug._service.gridHelper.removeFromParent();
			if (enabled)
				this._app.world.scene().add(this._app.debug._service.gridHelper);
		}
		if (this._app.debug._service.axesHelper) {
			this._app.debug._service.axesHelper.removeFromParent();
			if (enabled)
				this._app.world.scene().add(this._app.debug._service.axesHelper);
		}
	}

	public resetWorldDebug(): void {
		const directionalLight = this._worldService.defaultDirectionalLight;
		if (directionalLight) {
			if (this._directionalLightHelper) {
				this._directionalLightHelper.removeFromParent();
				this._directionalLightHelper.dispose();
				this._directionalLightHelper = undefined;
			}

			this._directionalLightHelper = new DirectionalLightHelper(
				directionalLight
			);
			this._app.world.scene().add(this._directionalLightHelper!);
		}
	}

	public resetCharacterDebug(): void {
		if (this._characterWalkingPathsLines) {
			Object.values(this._characterWalkingPathsLines).forEach((line) => {
				line.removeFromParent();
				line.geometry.dispose();
				if (line.material instanceof Material) line.material.dispose();
			});
		}

		Object.entries(this._characterService.walkingPaths).forEach(
			([name, points]) => {
				this._characterWalkingPathsLines[name] = new Line(
					new BufferGeometry().setFromPoints(points.getPoints(50)),
					new LineBasicMaterial({
						color: 0xff0000,
					})
				);
			}
		);

		this._characterLookAtIndicator = new Mesh(
			new SphereGeometry(0.1, 32, 32),
			new MeshBasicMaterial({ color: 0x00ff00 })
		);

		this._app.world
			.scene()
			.add(
				...Object.values(this._characterWalkingPathsLines),
				this._characterLookAtIndicator
			);
	}

	public reset(): void {
		if (!this.enabled) return;

		this.resetControls();
		this.resetWorldDebug();
		this.resetCharacterDebug();
		this._handleEnabledChange(true);
	}

	public resetControls(): void {
		const appDebug = this._app.debug;
		const orbitControls = appDebug.getCameraControls() as
			| OrbitControls
			| undefined;
		const miniOrbitControls = appDebug.getMiniCameraControls() as
			| OrbitControls
			| undefined;

		if (orbitControls) {
			orbitControls.target.set(0, 0, 0);
			orbitControls.enableRotate = true;
			orbitControls.enableZoom = true;
			orbitControls.enablePan = true;
		}

		if (miniOrbitControls) {
			miniOrbitControls.enableRotate = true;
		}
	}

	public handlePaneChange(props: { type: string; value: unknown }): void {
		// Global
		if (props.type === "global-enabled")
			this._handleEnabledChange(!!props.value);
		if (!this.enabled) return;
		if (props.type === "global-reset") this.reset();

		// Color Management
		if (props.type === "colorManagement-enabled")
			ColorManagement.enabled = !!props.value;

		// Light Helpers
		if (props.type === "lightHelpers-reset") this.resetWorldDebug();

		// Renderer
		if (this._renderer instanceof WebGLRenderer) {
			if (props.type === "renderer-autoClear")
				this._renderer.autoClear = !!props.value;
			if (props.type === "renderer-clearAlpha")
				this._renderer.setClearAlpha(Number(props.value) || 0);
			if (props.type === "renderer-clearColor")
				this._renderer.setClearColor(
					`${props.value}`,
					this._renderer.getClearAlpha()
				);
			if (props.type === "renderer-toneMapping")
				this._renderer.toneMapping = props.value as ToneMapping;
			if (props.type === "renderer-toneExposure")
				this._renderer.toneMappingExposure = props.value as ToneMapping;
		}
	}

	public update() {
		this._characterLookAtIndicator?.position.copy(
			this._characterService.character?.userData.lookAt || VECTOR_ZERO
		);
	}
}
