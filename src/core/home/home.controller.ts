import { HomeEventType } from "@/shared/types/home.type";
import {
	filter,
	fromEvent,
	map,
	merge,
	Observable,
	share,
	Subject,
} from "rxjs";
import { Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class HomeController {
	public readonly event$$ = new Subject<{
		type: HomeEventType;
	}>();
	public readonly event$: Observable<{
		type: HomeEventType;
	}> = merge(
		fromEvent<MessageEvent<{ type: HomeEventType }>>(self, "message").pipe(
			map((event) => {
				let type: HomeEventType | undefined = undefined;

				if (
					(
						[
							"curtainsOpened",
							"tvCrashed",
							"electricityShutdown",
							"acStarted",
							"kitchenInFire",
							"door1Knocked",
							"door2Knocked",
						] as HomeEventType[]
					).includes(event.data.type)
				) {
					type = event.data.type;
				}
				return { type };
			}),
			filter(({ type }) => type !== undefined)
		) as Observable<{ type: HomeEventType }>,
		this.event$$
	).pipe(share());

	constructor() {}
}
