import {
	filter,
	fromEvent,
	map,
	merge,
	Observable,
	share,
	Subject,
} from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";

import type {
	CameraAngle,
	CameraTransitionOptions,
} from "@/shared/types/camera.type";
import { AppModule } from "@quick-threejs/reactive/worker";

export interface CameraPositionChangeEvent {
	angle: CameraAngle;
	position: number;
	options?: CameraTransitionOptions;
}

export interface CameraAngleChangeEvent {
	angle: CameraAngle;
	options?: CameraTransitionOptions;
}

export interface CameraPositionNumberChangeEvent {
	position: number;
	options?: CameraTransitionOptions;
}

@scoped(Lifecycle.ContainerScoped)
export class CameraController {
	public readonly positionChange$$ = new Subject<CameraPositionChangeEvent>();
	public readonly positionChange$ = this.positionChange$$.pipe(share());
	public readonly switchAngle$ = fromEvent<MessageEvent<any>>(
		self,
		"message"
	).pipe(
		filter((event) => event.data.type === "switch-camera-angle"),
		share()
	);
	public readonly switchPosition$ = fromEvent<MessageEvent<any>>(
		self,
		"message"
	).pipe(
		filter((event) => event.data.type === "switch-camera-position"),
		share()
	);
	public readonly zoom$: Observable<{ type: "in" | "out" }>;

	constructor(@inject(AppModule) private readonly _app: AppModule) {
		this.zoom$ = merge(
			this._app.pointerdown$?.()!,
			this._app.pointerup$?.()!
		).pipe(
			map(({ type }) => {
				return { type: type === "pointerdown" ? "in" : "out" };
			})
		);
	}

	public changePosition(
		angle: CameraAngle,
		position: number,
		options?: CameraTransitionOptions
	): void {
		this.positionChange$$.next({ angle, position, options });
	}
}
