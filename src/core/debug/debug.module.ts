import { Module } from "@quick-threejs/reactive";
import { Subscription } from "rxjs";
import { inject, singleton } from "tsyringe";

import { DebugController } from "./debug.controller";
import { DebugService } from "./debug.service";
import { AppModule } from "@quick-threejs/reactive/worker";

@singleton()
export class DebugModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(DebugService) private readonly _service: DebugService,
		@inject(DebugController) private readonly _controller: DebugController,
		@inject(AppModule) private readonly _app: AppModule
	) {
		this._subscriptions.push(
			this._controller.message$.subscribe(
				this._service.handlePaneChange.bind(this._service)
			),
			this._app.timer
				.step$()
				.subscribe(this._service.update.bind(this._service))
		);
	}

	init() {
		this._service.reset();
	}

	dispose() {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
