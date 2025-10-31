import { Module } from "@quick-threejs/reactive";
import { AppModule } from "@quick-threejs/reactive/worker";
import { inject, Lifecycle, scoped } from "tsyringe";
import { Subscription } from "rxjs";

import { CharacterController } from "./character.controller";
import { CharacterService } from "./character.service";
import { HomeController } from "../home/home.controller";

@scoped(Lifecycle.ContainerScoped)
export class CharacterModule implements Module {
	private readonly _subscriptions: (Subscription | undefined)[] = [];

	constructor(
		@inject(AppModule) private readonly _app: AppModule,
		@inject(CharacterController)
		private readonly _controller: CharacterController,
		@inject(HomeController) private readonly _homeController: HomeController,
		@inject(CharacterService) private readonly _service: CharacterService
	) {
		this._subscriptions.push(
			this._controller.startWalking$.subscribe(({ path }) =>
				this._service.startWalking.bind(this._service)(path)
			),
			this._controller.walking$.subscribe(
				this._service.updateWalking.bind(this._service)
			),
			this._controller.stopWalking$.subscribe(({ reversed }) =>
				this._service.stopWalking.bind(this._service)(reversed)
			),
			this._homeController.event$.subscribe(
				this._service.registerEventAction.bind(this._service)
			),
			this._controller.performEventAction$.subscribe((val) => {
				const performedType = this._service.handlePerformEventAction.bind(
					this._service
				)(val);

				if (performedType)
					this._homeController.event$$.next({ type: performedType });

				this._service.updateChaosGauge(-5);
				setTimeout(() => {
					this._controller.startWalking$$.next({ ...val, reversed: true });
				}, 1000);
			}),
			this._controller.eventActionTrigger$.subscribe(
				({ type, path, reversed, speedMultiplier, ease }) => {
					if (
						this._service.characterIsWalking ||
						this._service.characterIsInEventAction ||
						this._service.gameOver
					)
						return;

					if (this._service.chaosGaugeReached) {
						this._controller.startWalking$$.next({
							type: "door1Knocked",
							path: "door-1",
							reversed: false,
							speedMultiplier: 1.05,
							ease: 0.1,
						});
						this._service.gameOver = true;
						self.postMessage({ token: "character-chaos-reached" });
						return;
					}

					this._service.characterCurrentEventAction = {
						type,
						path,
						speedMultiplier,
						reversed,
					};

					this._controller.startWalking$$.next({
						type,
						path,
						reversed,
						speedMultiplier,
						ease,
					});

					self.postMessage({ token: "character-event", type });
				}
			),
			this._controller.chaosGauge$.subscribe(() => {
				const chaosGauge = this._service.updateChaosGauge();
				if (chaosGauge >= 100) this._controller.chaosReached$$.next();
				self.postMessage({ token: "character-chaos-gauge", chaosGauge });
			}),
			this._controller.chaosReached$$.subscribe(() => {
				this._service.chaosGaugeReached = true;
			}),
			this._app.timer.step$().subscribe(({ delta }) => {
				this._service.updateAnimation(delta);
			})
		);
	}

	init(): void {
		this._service.init();
	}

	dispose(): void {
		this._subscriptions.forEach((sub) => sub?.unsubscribe());
	}
}
