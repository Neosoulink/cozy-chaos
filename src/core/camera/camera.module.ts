import { Module } from "@quick-threejs/reactive";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { CameraService } from "./camera.service";
import { CameraController } from "./camera.controller";
import { AppModule } from "@quick-threejs/reactive/worker";

@scoped(Lifecycle.ContainerScoped)
export class CameraModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(CameraController)
		private readonly _controller: CameraController,
		@inject(CameraService) private readonly _service: CameraService
	) {
		this._subscriptions.push(
			this._controller.positionChange$.subscribe(
				({ angle, position, options }) =>
					this._service.moveToPosition(angle, position, options)
			),
			this._controller.switchAngle$.subscribe(() =>
				this._service.switchAngle()
			),
			this._controller.switchPosition$.subscribe(() =>
				this._service.switchPosition()
			),
			this._app.timer
				.step$()
				.subscribe(this._service.update.bind(this._service)),
			this._controller.zoom$.subscribe(({ type }) => {
				if (type === "in") this._service.zoomIn();
				else this._service.zoomOut();
			}),
			this._controller.lockCamera$.subscribe((locked) => {
				this._service.cameraLocked = locked;
			}),
			this._app
				.mousemove$?.()
				.subscribe(({ height, width, clientX, clientY }) => {
					this._service.cursorPositionTarget.set(
						clientX / width - 0.5,
						clientY / height - 0.5
					);
				})
		);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
