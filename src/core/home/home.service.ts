import { AppModule } from "@quick-threejs/reactive/worker";
import { gsap } from "gsap";
import {
	Group,
	Material,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Vector3,
} from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { inject, Lifecycle, scoped } from "tsyringe";

import { WorldService } from "../world/world.service";
import { HomeEventType } from "@/shared/types/home.type";
import { createParticleSystem } from "@/shared/utils/vfx-shader.util";

const KITCHEN_POSITION = new Vector3(0.7, 0.9, -5.7);

@scoped(Lifecycle.ContainerScoped)
export class HomeService {
	public model?: GLTF;
	public home?: Group;
	public tvScreen?: Mesh;
	public lightSwitch?: Mesh;
	public door1?: Mesh;
	public door2?: Mesh;
	public curtain?: Mesh;
	public isDoor1Open = false;
	public isDoor2Open = false;
	public isCurtainOpen = false;
	public acColdIndicator?: Mesh;
	public wColdIndicator?: Mesh;
	public vfxKitchenInFire?: ReturnType<typeof createParticleSystem>;
	public materials: {
		tvScreen?: MeshBasicMaterial;
		door1OutsideMaterial?: MeshBasicMaterial;
		door2OutsideMaterial?: MeshBasicMaterial;
		windowOutsideMaterial?: MeshBasicMaterial;
	} = {};

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _world: WorldService
	) {}

	init(): void {
		const resources = this._app.loader.getLoadedResources();
		const model = resources["home"] as GLTF | undefined;

		if (!(model?.scene instanceof Group)) return;

		this.model = model;
		this.home = this.model.scene;
		this.home.renderOrder = 1;

		this.materials.door1OutsideMaterial = new MeshBasicMaterial({
			map: this._world.textures.door1OutsideTexture,
		});
		this.materials.door2OutsideMaterial = new MeshBasicMaterial({
			map: this._world.textures.door2OutsideTexture,
		});
		this.materials.windowOutsideMaterial = new MeshBasicMaterial({
			map: this._world.textures.windowOutsideTexture,
		});
		this.materials.tvScreen = new MeshBasicMaterial({
			map: this._world.textures.tvScreenTexture,
		});
		this.home.traverseVisible((child) => {
			if (child instanceof Object3D) {
				child.castShadow = true;
				child.receiveShadow = true;
			}

			if (
				child instanceof Mesh &&
				this._world.defaultMaterial instanceof Material
			) {
				child.material = this._world.defaultMaterial;
				if (child.name === "LR-TV-screen") {
					this.tvScreen = child;
					if (this.materials.tvScreen)
						this.tvScreen.material = this.materials.tvScreen;
				}
				if (child.name === "Light-switch") {
					this.lightSwitch = child;
				}
				if (child.name === "W-door-1") this.door1 = child;
				if (child.name === "W-door-1-outside")
					child.material = this.materials.door1OutsideMaterial;
				if (child.name === "W-door-2") this.door2 = child;
				if (child.name === "W-door-2-outside")
					child.material = this.materials.door2OutsideMaterial;
				if (child.name === "W-curtain") {
					this.curtain = child;
					this.curtain.userData.initialPosition = this.curtain.position.clone();
				}
				if (child.name === "W-window-outside")
					child.material = this.materials.windowOutsideMaterial;
				if (child.name === "AC-cold-indicator") {
					this.acColdIndicator = child;
					this.acColdIndicator.material = this._world.snowflakeEffect!.material;
					this.acColdIndicator.visible = false;
				}
				if (child.name === "W-cold-indicator") {
					this.wColdIndicator = child;
					this.wColdIndicator.material = this._world.snowflakeEffect!.material;
					this.wColdIndicator.visible = false;
				}
				if (child.name !== "Merged") child.castShadow = false;
			}
		});

		this._app.world.scene().add(this.home);
	}

	public openDoor1(): void {
		if (!this.door1 || this.isDoor1Open) return;
		this.isDoor1Open = true;
		gsap.fromTo(this.door1.rotation, { y: 0 }, { y: Math.PI * 0.5 });
	}

	public closeDoor1(): void {
		if (!this.door1 || !this.isDoor1Open) return;
		this.isDoor1Open = false;
		gsap.fromTo(this.door1.rotation, { y: Math.PI * 0.5 }, { y: 0 });
	}

	public openDoor2(): void {
		if (!this.door2 || this.isDoor2Open) return;
		gsap.fromTo(
			this.door2.rotation,
			{ y: 0 },
			{
				y: Math.PI * 0.5,
				onComplete: () => {
					this.isDoor2Open = true;
				},
			}
		);
	}

	public closeDoor2(): void {
		if (!this.door2 || !this.isDoor2Open) return;
		gsap.fromTo(
			this.door2.rotation,
			{ y: Math.PI * 0.5 },
			{
				y: 0,
				onComplete: () => {
					this.isDoor2Open = false;
				},
			}
		);
	}

	public openCurtain(): void {
		if (!this.curtain || this.isCurtainOpen) return;
		this.isCurtainOpen = true;
		gsap.fromTo(
			this.curtain.position,
			{ y: this.curtain.userData.initialPosition.y },
			{ y: 3.5 }
		);
	}

	public closeCurtain(): void {
		if (!this.curtain || !this.isCurtainOpen) return;
		this.isCurtainOpen = false;
		gsap.fromTo(
			this.curtain.position,
			{ y: 3.5 },
			{ y: this.curtain.userData.initialPosition.y }
		);
	}

	public handleEvent({ type }: { type: HomeEventType }) {
		const viewportHeight = this._app.sizes.height();
		const camera = this._app.camera.instance()!;

		if (!camera) return;

		if (type === "acStarted") {
			if (this.acColdIndicator) this.acColdIndicator.visible = true;
		}

		if (type === "acStopped") {
			if (this.acColdIndicator) this.acColdIndicator.visible = false;
		}

		if (type === "curtainsOpened") {
			this.openCurtain();
			if (this.wColdIndicator) this.wColdIndicator.visible = true;
		}

		if (type === "curtainsClosed") {
			this.closeCurtain();
			if (this.wColdIndicator) this.wColdIndicator.visible = false;
		}

		if (
			type === "kitchenInFire" &&
			!this.vfxKitchenInFire &&
			this._world.textures.fireTexture
		) {
			this.vfxKitchenInFire = createParticleSystem({
				camera,
				emitterPosition: KITCHEN_POSITION,
				texture: this._world.textures.fireTexture,
				viewportHeight,
				maxSize: 1.5,
			});
			this._app.world.scene().add(this.vfxKitchenInFire.points);
		}

		if (type === "kitchenFireExtinguished" && this.vfxKitchenInFire) {
			this.vfxKitchenInFire.dispose();
			this.vfxKitchenInFire = undefined;
		}

		if (
			type === "tvCrashed" &&
			this.tvScreen &&
			this._world.textures.lightingTexture &&
			!this.tvScreen.userData.crashed &&
			!this.tvScreen.userData.vfx
		) {
			const tvMaterial = this.tvScreen.material as MeshBasicMaterial;
			this.tvScreen.userData.crashed = true;
			this.tvScreen.userData.vfx = createParticleSystem({
				camera,
				emitterPosition: this.tvScreen.position
					.clone()
					.add({ x: -0.2, y: 0, z: 0 }),
				texture: this._world.textures.lightingTexture,
				viewportHeight,
				rate: 10,
				radius: 0.5,
			});
			tvMaterial.map = this._world.textures.tvScreenBrokenTexture!;
			this._app.world.scene().add(this.tvScreen.userData.vfx.points);
		}

		if (
			type === "tvRestored" &&
			this.tvScreen &&
			this.tvScreen.userData.vfx &&
			this.tvScreen.userData.crashed
		) {
			const tvMaterial = this.tvScreen.material as MeshBasicMaterial;
			this.tvScreen.userData.vfx.dispose();
			this.tvScreen.userData.crashed = false;
			this.tvScreen.userData.vfx = undefined;
			tvMaterial.map = this._world.textures.tvScreenTexture!;
		}

		if (
			type === "electricityShutdown" &&
			this.lightSwitch &&
			this._world.textures.lightingTexture &&
			!this.lightSwitch.userData.shutdown &&
			!this.lightSwitch.userData.vfx
		) {
			this.lightSwitch.userData.shutdown = true;
			this.lightSwitch.userData.vfx = createParticleSystem({
				camera,
				emitterPosition: this.lightSwitch.position
					.clone()
					.add({ x: 0.05, y: 0, z: 0 }),
				texture: this._world.textures.lightingTexture,
				viewportHeight,
				rate: 10,
				maxSize: 0.4,
				velocity: { x: 0, y: 0.2, z: 0 },
			});
			this._app.world.scene().add(this.lightSwitch.userData.vfx.points);
		}

		if (
			type === "electricityRestored" &&
			this.lightSwitch &&
			this.lightSwitch.userData.vfx
		) {
			this.lightSwitch.userData.vfx.dispose();
			this.lightSwitch.userData.shutdown = false;
			this.lightSwitch.userData.vfx = undefined;
		}
	}

	public update({ delta }: { delta: number }) {
		if (this.tvScreen?.userData.vfx) this.tvScreen.userData.vfx.step(delta);
		if (this.lightSwitch?.userData.vfx)
			this.lightSwitch.userData.vfx.step(delta);
		this.vfxKitchenInFire?.step(delta);
	}
}
