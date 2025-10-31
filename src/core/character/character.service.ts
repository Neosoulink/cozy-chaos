import { AppModule } from "@quick-threejs/reactive/worker";
import {
	AnimationAction,
	AnimationMixer,
	CatmullRomCurve3,
	Euler,
	Group,
	Material,
	Mesh,
	Object3D,
	Vector3,
} from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { gsap } from "gsap";
import { inject, Lifecycle, scoped } from "tsyringe";

import type { CharacterWalkingPath } from "@/shared/types/character.type";
import type { HomeEventType } from "@/shared/types/home.type";
import type { CharacterEventAction } from "./character.controller";
import { CHARACTER_WALKING_PATHS } from "@/shared/constants/character.constant";
import { VECTOR_ZERO } from "@/shared/constants/common.constant";
import { WorldService } from "../world/world.service";
import { HomeService } from "../home/home.service";

@scoped(Lifecycle.ContainerScoped)
export class CharacterService {
	public model?: GLTF;
	public character?: Group & {
		userData: Group["userData"] & {
			lookAt: Vector3;
			initialPosition: Vector3;
			initialRotation: Euler;
		};
	};
	public characterEventActionsQueue: {
		type: HomeEventType;
		path: CharacterWalkingPath;
		speedMultiplier?: number;
		reversed?: boolean;
	}[] = [];
	characterCurrentEventAction?: {
		type: HomeEventType;
		path: CharacterWalkingPath;
		speedMultiplier?: number;
		reversed?: boolean;
	};
	public characterIsWalking = false;
	public characterIsInEventAction = false;
	public animation?: AnimationMixer;
	public animationActions: Map<string, AnimationAction> = new Map();
	public animationCurrentAction?: AnimationAction;
	public walkingPaths: Partial<Record<CharacterWalkingPath, CatmullRomCurve3>> =
		{};
	public walkingCurrentPath?: CatmullRomCurve3;
	public chaosGauge = 0;
	public chaosGaugeReached = false;
	public gameOver = false;

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _world: WorldService,
		@inject(HomeService) private readonly _home: HomeService
	) {
		this._initWalkingPaths();
	}

	private _initWalkingPaths(): void {
		CHARACTER_WALKING_PATHS.forEach((path) => {
			this.walkingPaths[path.name] = new CatmullRomCurve3(
				[...path.points].reverse().map(({ x, y, z }) => new Vector3(x, y, z)),
				false,
				"centripetal",
				1
			);
		});
	}

	private _initModelCharacter(): void {
		const resources = this._app.loader.getLoadedResources();
		const model = resources["character"] as GLTF | undefined;
		const initialPathKey = Object.keys(this.walkingPaths)[0];
		const initialPosition =
			(initialPathKey && this.walkingPaths[initialPathKey]?.getPoint(0)) ||
			VECTOR_ZERO.clone();

		if (!(model?.scene instanceof Group)) return;

		this.model = model;
		this.character = this.model.scene as Exclude<
			CharacterService["character"],
			undefined
		>;
		this.character.userData = {
			lookAt: VECTOR_ZERO.clone(),
			initialPosition,
			initialRotation: new Euler(0, Math.PI * 1.5, 0),
		};
		this.character.renderOrder = 1;
		this.character.position.set(
			initialPosition.x,
			initialPosition.y,
			initialPosition.z
		);
		this.character.traverseVisible((child) => {
			if (child instanceof Object3D) child.castShadow = true;

			if (
				child instanceof Mesh &&
				this._world.defaultMaterial instanceof Material
			)
				child.material = this._world.defaultMaterial;
		});
		this.character.rotation.copy(this.character.userData.initialRotation);

		this._app.world.scene().add(this.character);
	}

	private _initAnimations(): void {
		if (!this.model || !this.character) return;

		this.animation = new AnimationMixer(this.character);

		this.model.animations.forEach((clip) => {
			const action = this.animation!.clipAction(clip);
			this.animationActions.set(clip.name, action);
		});

		this.playAnimation("Idle");
	}

	private _calculateLookAtRotation(from: Vector3, to: Vector3): Euler {
		const direction = new Vector3().subVectors(to, from).normalize();
		const yRotation = Math.atan2(direction.x, direction.z) + Math.PI;

		return new Euler(0, yRotation, 0);
	}

	private _calculateCharacterDistanceFromPosition(position: Vector3): number {
		if (!this.character) return 0;
		return this.character.position.distanceTo(position);
	}

	init(): void {
		this._initModelCharacter();
		this._initAnimations();
	}

	public registerEventAction({ type }: { type: HomeEventType }): void {
		let path: CharacterWalkingPath | undefined = undefined;
		let speedMultiplier = 1;
		let reversed = false;

		switch (type) {
			case "electricityShutdown":
				path = "electricity";
				speedMultiplier = 2;
				break;
			case "tvCrashed":
				path = "tv";
				speedMultiplier = 3;
				break;
			case "door1Knocked":
				path = "door-1";
				break;
			case "door2Knocked":
				path = "door-2";
				break;
			case "kitchenInFire":
				path = "kitchen";
				break;
			case "acStarted":
				path = "ac";
				speedMultiplier = 2;
				break;
			case "curtainsOpened":
				path = "curtains";
				speedMultiplier = 3;
				break;
		}

		const existingEventAction = this.characterEventActionsQueue.find(
			(eventAction) => eventAction.type === type
		);

		if (existingEventAction || !path) return;

		this.updateChaosGauge(15);
		this.characterEventActionsQueue.push({
			type,
			path,
			speedMultiplier,
			reversed,
		});
	}

	public playAnimation(name: string, transitionDuration: number = 0.3): void {
		const action = this.animationActions.get(name);

		if (!action) return console.warn(`Animation "${name}" not found`);

		if (this.animationCurrentAction && this.animationCurrentAction !== action)
			this.animationCurrentAction.fadeOut(transitionDuration);

		action.reset().fadeIn(transitionDuration).play();
		this.animationCurrentAction = action;
	}

	public startWalking(pathName: CharacterWalkingPath): void {
		const path = this.walkingPaths[pathName];

		if (!path) return console.warn(`Path "${pathName}" not found`);

		this.walkingCurrentPath = path;
		this.characterIsWalking = true;
		this.characterIsInEventAction = !this.chaosGaugeReached;

		this.playAnimation("Walk");
	}

	public updateWalking({
		current,
		target,
	}: {
		current: number;
		target: number;
	}): void {
		if (!this.character) return console.warn("🚧 Character not found");
		if (!this.walkingCurrentPath)
			return console.warn("🚧 Walking path not found");

		const ocDoorDistance = 1.15;
		const distanceFromDoor1 = this._calculateCharacterDistanceFromPosition(
			this._home.door1?.position || VECTOR_ZERO.clone()
		);
		const distanceFromDoor2 = this._calculateCharacterDistanceFromPosition(
			this._home.door2?.position || VECTOR_ZERO.clone()
		);

		this.walkingCurrentPath?.getPointAt(target, this.character.userData.lookAt);
		this.walkingCurrentPath?.getPointAt(current, this.character.position);
		this.character.rotation.copy(
			this._calculateLookAtRotation(
				this.character.position,
				this.character.userData.lookAt
			)
		);

		if (distanceFromDoor1 <= ocDoorDistance) this._home.openDoor1();
		if (distanceFromDoor2 <= ocDoorDistance) this._home.openDoor2();
		if (distanceFromDoor1 > ocDoorDistance) this._home.closeDoor1();
		if (distanceFromDoor2 > ocDoorDistance) this._home.closeDoor2();
	}

	public stopWalking(reversed?: boolean): void {
		if (this.chaosGaugeReached && this.gameOver) {
			self.postMessage({ token: "game-over" });
			console.log("game over");

			return;
		}

		this.characterIsWalking = false;
		this.playAnimation("Idle");

		if (reversed) {
			this.characterIsInEventAction = false;
			this.characterEventActionsQueue = this.characterEventActionsQueue.filter(
				(eventAction) =>
					eventAction.path !== this.characterCurrentEventAction?.path
			);
			setTimeout(() => {
				gsap.to(this.character?.rotation || {}, {
					y: this.character?.userData.initialRotation.y,
					duration: 1,
					ease: "power2.inOut",
				});
			}, 100);
		}
	}

	public handlePerformEventAction({ type }: CharacterEventAction) {
		let returnType: HomeEventType | undefined = undefined;

		this.playAnimation("PerformAction");
		self.postMessage({ token: "character-performed-event", type });

		switch (type) {
			case "electricityShutdown":
				returnType = "electricityRestored";
				break;
			case "tvCrashed":
				returnType = "tvRestored";
				break;
			case "door1Knocked":
				returnType = "door1KnockedHandled";
				break;
			case "door2Knocked":
				returnType = "door2KnockedHandled";
				break;
			case "kitchenInFire":
				returnType = "kitchenFireExtinguished";
				break;
			case "acStarted":
				returnType = "acStopped";
				break;
			case "curtainsOpened":
				returnType = "curtainsClosed";
				break;
		}

		return returnType;
	}

	public updateAnimation(delta: number): void {
		this.animation?.update(delta);
	}

	public updateChaosGauge(step: number = -0.075): number {
		if (step >= 5) self.postMessage({ token: "character-chaos-triggered" });

		this.chaosGauge = gsap.utils.clamp(0, 200, this.chaosGauge + step);
		return this.chaosGauge;
	}
}
