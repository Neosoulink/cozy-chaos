import "reflect-metadata";

import { AppModule, launchApp } from "@quick-threejs/reactive/worker";
import { container } from "tsyringe";

import { CoreModule } from "./core.module";

launchApp({
	onReady: (app) => {
		const { module: appModule } = app;

		container.register(AppModule, { useValue: appModule });
		container.resolve(CoreModule);
	},
});
