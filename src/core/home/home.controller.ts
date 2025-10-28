import { HomeEventType } from "@/shared/types/home.type";
import { share, Subject } from "rxjs";
import { Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class HomeController {
	public readonly event$$ = new Subject<{
		type: HomeEventType;
	}>();
	public readonly event$ = this.event$$.pipe(share());

	constructor() {}
}
