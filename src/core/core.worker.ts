import "reflect-metadata";

import { AppModule, launchApp } from "@quick-threejs/reactive/worker";
import { container } from "tsyringe";

import { CoreModule } from "./core.module";

launchApp({
	onReady: (app) => {
		const { module: appModule } = app;

		container.register(AppModule, { useValue: appModule });
		const coreModule = container.resolve(CoreModule);

		appModule.loader.getLoadCompleted$().subscribe(() => {
			coreModule.init();
		});
	},
});
