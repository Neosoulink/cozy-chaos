import { Module } from "@quick-threejs/reactive";
import { AppModule } from "@quick-threejs/reactive/worker";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { WorldService } from "./world.service";

@scoped(Lifecycle.ContainerScoped)
export class WorldModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _service: WorldService
	) {
		this._subscriptions.push(
			this._app.timer
				.step$()
				.subscribe(this._service.update.bind(this._service))
		);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
