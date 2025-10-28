import { AppModule } from "@quick-threejs/reactive/worker";
import { gsap } from "gsap";
import {
	expand,
	filter,
	map,
	merge,
	Observable,
	share,
	Subject,
	switchMap,
	takeUntil,
	timer,
} from "rxjs";
import { inject, Lifecycle, scoped } from "tsyringe";
import { CHARACTER_WALKING_PATHS } from "@/shared/constants/character.constant";
import { CharacterService } from "./character.service";
import { HomeEventType } from "@/shared/types/home.type";

type CharacterWalkingPath = (typeof CHARACTER_WALKING_PATHS)[number]["name"];
export type CharacterEventAction = {
	type: HomeEventType;
	path: CharacterWalkingPath;
	reversed?: boolean;
	speedMultiplier?: number;
	ease?: number;
};

@scoped(Lifecycle.ContainerScoped)
export class CharacterController {
	public readonly startWalking$$ = new Subject<CharacterEventAction>();
	public readonly stopWalking$$ = new Subject<CharacterEventAction>();
	public readonly animate$: Observable<number>;
	public readonly startWalking$: Observable<CharacterEventAction>;
	public readonly walking$: Observable<{
		current: number;
		target: number;
	}>;
	public readonly stopWalking$: Observable<CharacterEventAction>;
	public readonly performEventAction$: Observable<CharacterEventAction>;
	public readonly eventActionTrigger$: Observable<CharacterEventAction>;

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(CharacterService) private readonly _service: CharacterService
	) {
		this.animate$ = this._app.timer.step$().pipe(
			share(),
			map((step) => step.delta)
		);
		this.startWalking$ = merge(this.startWalking$$).pipe(share());
		this.walking$ = this.startWalking$.pipe(
			share(),
			switchMap(
				({ type, path, reversed, speedMultiplier = 1.05, ease = 0.1 }) => {
					let current = reversed ? 1 : 0;
					let target = reversed ? 1 : 0;

					return this._app.timer.step$().pipe(
						takeUntil(this.stopWalking$$),
						map(() => {
							const shouldContinue = reversed ? target > 0 : target < 1;
							const step = 0.001 * speedMultiplier;

							current = gsap.utils.interpolate(current, target, ease);
							target = gsap.utils.clamp(
								0,
								1,
								reversed ? target - step : target + step
							);

							if (!shouldContinue)
								this.stopWalking$$.next({
									type,
									path,
									reversed,
									speedMultiplier,
									ease,
								});
							return { current, target };
						})
					);
				}
			)
		);
		this.stopWalking$ = merge(this.stopWalking$$.pipe(share()));
		this.performEventAction$ = this.stopWalking$.pipe(
			filter(() => this._service.characterIsInEventAction),
			share()
		);
		this.eventActionTrigger$ = timer(0).pipe(
			expand(() => {
				const delays = [1000, 2000, 3000];
				return timer(delays[Math.floor(Math.random() * delays.length)]!);
			}),
			map(() => this._service.characterEventActionsQueue[0]!),
			filter(
				(val) => val && this._service.characterEventActionsQueue.length > 0
			)
		);
	}
}
