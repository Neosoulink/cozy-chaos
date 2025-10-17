import { Module } from "@quick-threejs/reactive";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { CharacterController } from "./character.controller";
import { CharacterService } from "./character.service";

@scoped(Lifecycle.ContainerScoped)
export class CharacterModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(CharacterController)
		private readonly _controller: CharacterController,
		@inject(CharacterService) private readonly _service: CharacterService
	) {
		this._subscriptions.push(
			this._controller.animate$.subscribe(
				this._service.update.bind(this._service)
			)
		);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
