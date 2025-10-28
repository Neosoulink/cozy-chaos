import { filter, fromEvent, share } from "rxjs";
import { scoped, Lifecycle } from "tsyringe";
@scoped(Lifecycle.ContainerScoped)
export class CoreController {
	public readonly startExperience$ = fromEvent<MessageEvent<any>>(
		self,
		"message"
	).pipe(
		filter((event) => event.data.type === "start-experience"),
		share()
	);

	constructor() {}
}
