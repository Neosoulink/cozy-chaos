import { AppModule } from "@quick-threejs/reactive/worker";
import {
	AnimationAction,
	AnimationMixer,
	Group,
	Material,
	Mesh,
	Object3D,
} from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { inject, Lifecycle, scoped } from "tsyringe";

import { WorldService } from "../world/world.service";

@scoped(Lifecycle.ContainerScoped)
export class CharacterService {
	public model?: GLTF;
	public scene?: Group;
	public animation?: AnimationMixer;
	public currentAction?: AnimationAction;
	public actions: Map<string, AnimationAction> = new Map();

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _world: WorldService
	) {}

	init(): void {
		const resources = this._app.loader.getLoadedResources();
		const model = resources["character"] as GLTF | undefined;

		if (!(model?.scene instanceof Group)) return;

		this.model = model;
		this.scene = this.model.scene;
		this.scene.renderOrder = 1;
		this.scene.traverseVisible((child) => {
			if (child instanceof Object3D) {
				child.castShadow = true;
				child.receiveShadow = true;
			}

			if (
				child instanceof Mesh &&
				this._world.defaultMaterial instanceof Material
			)
				child.material = this._world.defaultMaterial;
		});

		this._app.world.scene().add(this.scene);
		this._setupAnimations();
	}

	private _setupAnimations(): void {
		if (!this.model || !this.scene) return;

		this.animation = new AnimationMixer(this.scene);

		this.model.animations.forEach((clip) => {
			const action = this.animation!.clipAction(clip);
			this.actions.set(clip.name, action);
		});

		this.playAnimation("idle");
	}

	public playAnimation(name: string, transitionDuration: number = 0.3): void {
		const action = this.actions.get(name);

		if (!action) return console.warn(`Animation "${name}" not found`);

		if (this.currentAction && this.currentAction !== action)
			this.currentAction.fadeOut(transitionDuration);

		action.reset().fadeIn(transitionDuration).play();
		this.currentAction = action;
	}

	public update(deltaTime: number): void {
		if (this.animation) this.animation.update(deltaTime);
	}
}
