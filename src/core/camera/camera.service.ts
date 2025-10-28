import { AppModule } from "@quick-threejs/reactive/worker";
import { gsap } from "gsap";
import { inject, Lifecycle, scoped } from "tsyringe";
import { PerspectiveCamera, Vector2, Vector3 } from "three";

import type {
	CameraAngle,
	CameraTransitionOptions,
} from "@/shared/types/camera.type";
import { HOME_CAMERA_POSITIONS } from "@/shared/constants/camera.constant";
import { CharacterService } from "../character/character.service";
import { VECTOR_ZERO } from "@/shared/constants/common.constant";

@scoped(Lifecycle.ContainerScoped)
export class CameraService {
	public currentAngle: CameraAngle = "left";
	public currentPosition: number = 1;
	public isSwitching = false;
	public isZooming = true;
	public lookAtTarget = new Vector3();
	public lookAtCurrent = new Vector3();
	public cursorPositionTarget = new Vector2();
	public cursorPositionCurrent = new Vector2();

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(CharacterService)
		private readonly _characterService: CharacterService
	) {
		const camera = this._app.camera.instance() as PerspectiveCamera;
		if (camera) camera.fov = 50;
	}

	init(): void {
		const camera = this._app.camera.instance() as PerspectiveCamera;
		const angle = this.currentAngle === "left" ? -1 : 1;

		this.zoomOut();
		if (camera)
			camera.position.set(
				HOME_CAMERA_POSITIONS[this.currentPosition]!.x * angle,
				HOME_CAMERA_POSITIONS[this.currentPosition]!.y,
				HOME_CAMERA_POSITIONS[this.currentPosition]!.z
			);
	}

	public moveToPosition(
		angle: CameraAngle,
		position: number,
		options: CameraTransitionOptions = {}
	): void {
		const camera = this._app.camera.instance();
		const nextPosition = HOME_CAMERA_POSITIONS[position];
		const nextAngle = angle ? -1 : 1;
		const { duration = 1.5, ease = "power2.inOut" } = options || {};

		if (!camera) return console.warn("🚧 Camera not found");
		if (!nextPosition) return console.warn("🚧 Camera position not found");
		if (this.isSwitching) return;

		this.isSwitching = true;
		this.currentAngle = angle;
		this.currentPosition = position;

		gsap.to(camera.position, {
			x: nextPosition.x * nextAngle,
			y: nextPosition.y,
			z: nextPosition.z,
			duration,
			ease,
			onComplete: () => {
				this.isSwitching = false;
				options.onComplete?.();
			},
		});
	}

	public moveToPositionByAngle(
		angle: CameraAngle,
		options?: CameraTransitionOptions
	): void {
		this.moveToPosition(angle, this.currentPosition, options);
	}

	public moveToPositionByNumber(
		position: number,
		options?: CameraTransitionOptions
	): void {
		this.moveToPosition(this.currentAngle, position, options);
	}

	public zoomIn(): void {
		const camera = this._app.camera.instance() as PerspectiveCamera;
		if (!camera || this.isZooming) return;

		this.isZooming = true;
		gsap.to(camera, {
			duration: 1,
			ease: "power2.inOut",
			fov: 50,
		});
	}

	public zoomOut(): void {
		const camera = this._app.camera.instance() as PerspectiveCamera;
		if (!camera || !this.isZooming) return;
		gsap.to(camera, {
			duration: 1,
			ease: "power2.inOut",
			fov: 70,
			onComplete: () => {
				this.isZooming = false;
			},
		});
	}

	public getCurrentPosition() {
		return HOME_CAMERA_POSITIONS[this.currentPosition];
	}

	public getAvailableAngles(): CameraAngle[] {
		return Object.keys(HOME_CAMERA_POSITIONS) as CameraAngle[];
	}

	public getAvailablePositions(): number[] {
		return HOME_CAMERA_POSITIONS.map((_, index) => index);
	}

	public isAtPosition(angle: CameraAngle, position: number): boolean {
		return this.currentAngle === angle && this.currentPosition === position;
	}

	public update() {
		const characterPosition =
			this._characterService.character?.position || VECTOR_ZERO.clone();
		const camera = this._app.camera.instance() as PerspectiveCamera;

		this.cursorPositionCurrent.lerp(this.cursorPositionTarget, 0.03);
		this.lookAtTarget
			.copy(
				characterPosition.x <= -2.3 ? VECTOR_ZERO.clone() : characterPosition
			)
			.add({
				x: 0 + this.cursorPositionCurrent.x * 0.8,
				y: 1 + this.cursorPositionCurrent.y * -0.8,
				z: 0,
			});
		this.lookAtCurrent.lerp(this.lookAtTarget, 0.03);

		if (camera) camera.lookAt(this.lookAtCurrent);
	}
}
