import { Module } from "@quick-threejs/reactive";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { HomeService } from "./home.service";

@scoped(Lifecycle.ContainerScoped)
export class HomeModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(@inject(HomeService) private readonly _service: HomeService) {
		this._subscriptions.push(...[]);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
