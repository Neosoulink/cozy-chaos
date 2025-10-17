import { AppModule } from "@quick-threejs/reactive/worker";
import { Group, Material, Mesh, Object3D } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { inject, Lifecycle, scoped } from "tsyringe";

import { WorldService } from "../world/world.service";

@scoped(Lifecycle.ContainerScoped)
export class HomeService {
	public model?: GLTF;
	public scene?: Group;

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(WorldService) private readonly _world: WorldService
	) {}

	init(): void {
		const resources = this._app.loader.getLoadedResources();
		const model = resources["home"] as GLTF | undefined;

		if (!(model?.scene instanceof Group)) return;

		this.model = model;
		this.scene = this.model.scene;

		this.scene.renderOrder = 1;
		this.scene.traverseVisible((child) => {
			if (child instanceof Object3D) {
				child.castShadow = true;
				child.receiveShadow = true;
			}

			if (
				child instanceof Mesh &&
				this._world.defaultMaterial instanceof Material
			)
				child.material = this._world.defaultMaterial;
		});

		this._app.world.scene().add(this.scene);
	}
}
