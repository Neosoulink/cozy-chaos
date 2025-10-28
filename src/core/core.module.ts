import { Module } from "@quick-threejs/reactive";
import { Subscription } from "rxjs";
import { inject, singleton } from "tsyringe";

import { WorldModule } from "./world/world.module";
import { HomeModule } from "./home/home.module";
import { CharacterModule } from "./character/character.module";
import { DebugModule } from "./debug/debug.module";
import { CameraModule } from "./camera/camera.module";
import { CoreController } from "./core.controller";

@singleton()
export class CoreModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(CoreController) public readonly controller: CoreController,
		@inject(WorldModule) public readonly world: WorldModule,
		@inject(HomeModule) public readonly home: HomeModule,
		@inject(CharacterModule) public readonly character: CharacterModule,
		@inject(DebugModule) public readonly debug: DebugModule,
		@inject(CameraModule) public readonly camera: CameraModule
	) {
		const startExperienceSubscription =
			this.controller.startExperience$.subscribe(() => {
				this.init();
				startExperienceSubscription.unsubscribe();
			});
		this._subscriptions.push(startExperienceSubscription);
	}

	init(): void {
		this.world.init();
		this.home.init();
		this.character.init();
		this.debug.init();
		this.camera.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
		this.world.dispose();
		this.home.dispose();
		this.character.dispose();
		this.debug.dispose();
		this.camera.dispose();
	}
}
