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
			<button class="angle"<span></span></button>
			<button class="position"><span></span></button>
		</div>

		<div class="info">
			<p class="text">Hold pointer to zoom in</p>

			<p class="text">Made by <a href="https://github.com/Neosoulink" target="_blank">Neosoulink</a> | <a href="https://github.com/Neosoulink/cozy-chaos/blob/master/CREDITS.md">Credits</a> | <a href="https://github.com/Neosoulink/cozy-chaos">Source Code</a></p>
		</div>

		<div class="message"></div>

		<div class="chaos-gauge">
			<div class="chaos-gauge-icon"></div>
			<div class="chaos-gauge-progress">
				<div class="chaos-gauge-progress-bar"></div>
			</div>
		</div>

		<div class="game-over">
			<h2 class="title">Game Over</h2>
			<h3 class="subtitle">Chaos Reached!</h3>

			<p class="description">Congratulation! You have ruined John's day!
			<br/>Now John is very depressed and he's going to drive his car right after a beer... 🍺</p>

			<div class="controls">
				<button class="restart-game">Restart Game</button>
				<button class="continue-game">Continue</button>
			</div>

			<div class="info">
				<p class="text">Made by <a href="https://github.com/Neosoulink" target="_blank">Neosoulink</a> | <a href="https://github.com/Neosoulink/cozy-chaos/blob/master/CREDITS.md">Credits</a> | <a href="https://github.com/Neosoulink/cozy-chaos">Source Code</a></p>
			</div>
		</div>
	`;

	const cameraAngleButton = container.querySelector(
		".camera .angle"
	) as HTMLButtonElement;
	const cameraPositionButton = container.querySelector(
		".camera .position"
	) as HTMLButtonElement;
	const chaosGauge = container.querySelector(".chaos-gauge") as HTMLDivElement;
	const chaosGaugeBar = chaosGauge?.querySelector(
		".chaos-gauge-progress-bar"
	) as HTMLDivElement;
	const chaosGaugeIcon = chaosGauge?.querySelector(
		".chaos-gauge-icon"
	) as HTMLDivElement;
	const gameOver = container.querySelector(".game-over") as HTMLDivElement;
	const restartGameButton = container.querySelector(
		".restart-game"
	) as HTMLButtonElement;
	const continueButton = container.querySelector(
		".continue-game"
	) as HTMLButtonElement;

	const message = container.querySelector(".message") as HTMLDivElement;

	const showMessage = (text: string, duration: number = 3) => {
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
							delay: duration,
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
		chaosGauge,
		chaosGaugeBar,
		chaosGaugeIcon,
		gameOver,
		restartGameButton,
		continueButton,
	};
};
