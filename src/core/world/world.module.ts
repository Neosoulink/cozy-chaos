import { Module } from "@quick-threejs/reactive";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { WorldService } from "./world.service";

@scoped(Lifecycle.ContainerScoped)
export class WorldModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(@inject(WorldService) private readonly _service: WorldService) {
		this._subscriptions.push(...[]);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
