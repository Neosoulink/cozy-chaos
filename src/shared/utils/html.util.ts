import { gsap } from "gsap";

export const createLoaderView = () => {
	const loaderView = document.createElement("div");
	loaderView.className = "loader-view";
	loaderView.innerHTML = /* html */ `
		<div class="container">
			<div class="title">Cozy Chaos</div>
			<div class="spinner"></div>
			<button class="start-experience">Start Experience</button>
			<div class="progress">
				<div class="progress-bar"></div>
			</div>

			<div class="text">
				<div class="text-header">Loading...</div>
				<div class="text-body">Loading assets...</div>
			</div>
		</div>
	`;
	document.body.appendChild(loaderView);

	return loaderView;
};

export const removeLoaderView = () => {
	const loaderView = document.querySelector(".loader-view");

	gsap.to(loaderView, {
		delay: 0.2,
		opacity: 0,
		onComplete: () => {
			setTimeout(() => {
				if (loaderView) loaderView.remove();
			}, 300);
		},
	});
};

export const createExperienceControls = () => {
	const container = document.createElement("div");
	const messageTL = gsap.timeline();

	container.className = "experience-controls";
	container.innerHTML = /* html */ `
		<div class="camera">
			<button class="angle">Switch Camera Angle</button>
			<button class="position">Switch Camera Position</button>
		</div>

		<div class="info">
			<p class="text">Hold pointer to zoom in</p>

			<p class="text">Made by <a href="https://github.com/Neosoulink" target="_blank">Neosoulink</a> | <a href="https://github.com/Neosoulink/cozy-chaos/blob/master/CREDITS.md">Credits</a> | <a href="https://github.com/Neosoulink/cozy-chaos">Source Code</a></p>
		</div>

		<div class="message"></div>
	`;

	const cameraAngleButton = container.querySelector(
		".camera .angle"
	) as HTMLButtonElement;
	const cameraPositionButton = container.querySelector(
		".camera .position"
	) as HTMLButtonElement;

	const message = container.querySelector(".message") as HTMLDivElement;

	const showMessage = (text: string) => {
		messageTL.clear();
		messageTL.fromTo(
			message,
			{ opacity: 0 },
			{
				opacity: 1,
				duration: 0.3,
				onComplete: () => {
					messageTL.fromTo(
						message,
						{ opacity: 1 },
						{
							delay: 3,
							opacity: 0,
							duration: 0.3,
						}
					);
				},
			}
		);
		message.textContent = text;
	};

	document.body.appendChild(container);
	gsap.fromTo(
		container,
		{
			opacity: 0,
			y: -100,
		},
		{
			opacity: 1,
			y: 0,
			duration: 0.5,
		}
	);

	return {
		container,
		cameraAngleButton,
		cameraPositionButton,
		message,
		showMessage,
	};
};
