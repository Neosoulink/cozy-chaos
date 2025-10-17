import { Module } from "@quick-threejs/reactive";
import { inject, singleton } from "tsyringe";

import { WorldModule } from "./world/world.module";
import { HomeModule } from "./home/home.module";
import { CharacterModule } from "./character/character.module";
import { DebugModule } from "./debug/debug.module";

@singleton()
export class CoreModule implements Module {
	constructor(
		@inject(WorldModule) public readonly world: WorldModule,
		@inject(HomeModule) public readonly home: HomeModule,
		@inject(CharacterModule) public readonly character: CharacterModule,
		@inject(DebugModule) public readonly debug: DebugModule
	) {}

	init(): void {
		this.world.init();
		this.home.init();
		this.character.init();
		this.debug.init();
	}

	dispose(): void {
		this.world.dispose();
		this.home.dispose();
		this.character.dispose();
		this.debug.dispose();
	}
}
