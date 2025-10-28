import { Module } from "@quick-threejs/reactive";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { HomeService } from "./home.service";
import { HomeController } from "./home.controller";
import { AppModule } from "@quick-threejs/reactive/worker";

@scoped(Lifecycle.ContainerScoped)
export class HomeModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(AppModule)
		private readonly _app: AppModule,
		@inject(HomeController)
		private readonly _controller: HomeController,
		@inject(HomeService) private readonly _service: HomeService
	) {
		this._subscriptions.push(
			this._controller.event$.subscribe(
				this._service.handleEvent.bind(this._service)
			),
			this._app.timer
				.step$()
				.subscribe(this._service.update.bind(this._service))
		);
	}

	init(): void {
		this._service.init();

		setTimeout(() => {
			this._controller.event$$.next({ type: "door1Knocked" });
		}, 1000);
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
