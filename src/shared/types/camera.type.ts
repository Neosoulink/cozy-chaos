export type CameraAngle = "left" | "right";

export interface CameraTransitionOptions {
	duration?: number;
	ease?: string;
	onComplete?: () => void;
}
