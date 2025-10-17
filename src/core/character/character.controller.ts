import { AppModule } from "@quick-threejs/reactive/worker";
import { map, Observable } from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class CharacterController {
	public readonly animate$: Observable<number>;

	constructor(@inject(AppModule) private readonly _app: AppModule) {
		this.animate$ = this._app.timer.step$().pipe(map((step) => step.delta));
	}
}
