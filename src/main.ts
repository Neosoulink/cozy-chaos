import { register } from "@quick-threejs/reactive";
import Stats from "stats.js";
import { Audio, AudioListener, PositionalAudio } from "three";
import { Pane } from "tweakpane";

import characterGltfPath from "@/assets/3D/character.glb?url";
import homeGltfPath from "@/assets/3D/home.glb?url";
import defaultAlbedoImgPath from "@/assets/textures/default-albedo.png?url";
import defaultEmissionImgPath from "@/assets/textures/default-emission.png?url";
import lightingSpriteImgPath from "@/assets/textures/lighting-sprite.png?url";
import fireSpriteImgPath from "@/assets/textures/fire-sprite.png?url";
import snowflakeSpriteImgPath from "@/assets/textures/snowflake-sprite.png?url";
import door1OutsideImgPath from "@/assets/textures/door-1-outside.jpg?url";
import door2OutsideImgPath from "@/assets/textures/door-2-outside.jpg?url";
import windowOutsideImgPath from "@/assets/textures/window-outside.jpg?url";
import tvScreenImgPath from "@/assets/textures/tv-screen.jpg?url";
import tvScreenBrokenImgPath from "@/assets/textures/tv-screen-broken.jpg?url";
import gameStartAudioPath from "@/assets/audios/game-start.mp3?url";
import menuSelectionAudioPath from "@/assets/audios/menu-selection.mp3?url";
import menuSelection2AudioPath from "@/assets/audios/menu-selection-2.mp3?url";
import cameraShutterAudioPath from "@/assets/audios/camera-shutter.mp3?url";
import electricityAudioPath from "@/assets/audios/electricity.mp3?url";
import winterBreezeAudioPath from "@/assets/audios/winter-breeze.mp3?url";
import knockDoorAudioPath from "@/assets/audios/knock-door.mp3?url";
import acAudioPath from "@/assets/audios/ac.mp3?url";
import fireAudioPath from "@/assets/audios/fire.mp3?url";
import notificationAudioPath from "@/assets/audios/notification.mp3?url";
import doorOpenAudioPath from "@/assets/audios/door-open.mp3?url";
import doorCloseAudioPath from "@/assets/audios/door-close.mp3?url";

import { configureTweakpane } from "./shared/utils/tweakpane.util";

import "./assets/styles/global.css";
import {
	createExperienceControls,
	createLoaderView,
	removeLoaderView,
} from "./shared/utils/html.util";
import { HomeEventType } from "./shared/types/home.type";

const isDev = import.meta.env.DEV;
const location = new URL(
	isDev ? `./core/core.worker.ts` : `worker.js`,
	import.meta.url
) as unknown as string;

if (isDev) console.log("🚧 worker location:", location);

createLoaderView();

const registerApp = () =>
	register({
		location,
		// enableDebug: isDev,
		enableControls: true,
		axesSizes: 5,
		gridSizes: 10,
		withMiniCamera: false,
		loaderDataSources: [
			{
				name: "character",
				path: characterGltfPath,
				type: "gltf",
			},
			{
				name: "home",
				path: homeGltfPath,
				type: "gltf",
			},
			{
				name: "default-albedo",
				path: defaultAlbedoImgPath,
				type: "image",
			},
			{
				name: "default-emission",
				path: defaultEmissionImgPath,
				type: "image",
			},
			{
				name: "lighting-sprite",
				path: lightingSpriteImgPath,
				type: "image",
			},
			{
				name: "fire-sprite",
				path: fireSpriteImgPath,
				type: "image",
			},
			{
				name: "snowflake-sprite",
				path: snowflakeSpriteImgPath,
				type: "image",
			},
			{
				name: "door-1-outside",
				path: door1OutsideImgPath,
				type: "image",
			},
			{
				name: "door-2-outside",
				path: door2OutsideImgPath,
				type: "image",
			},
			{
				name: "window-outside",
				path: windowOutsideImgPath,
				type: "image",
			},
			{
				name: "tv-screen",
				path: tvScreenImgPath,
				type: "image",
			},
			{
				name: "tv-screen-broken",
				path: tvScreenBrokenImgPath,
				type: "image",
			},
			{
				name: "game-start-audio",
				path: gameStartAudioPath,
				type: "audio",
			},
			{
				name: "menu-selection-audio",
				path: menuSelectionAudioPath,
				type: "audio",
			},
			{
				name: "menu-selection-action-audio",
				path: menuSelection2AudioPath,
				type: "audio",
			},
			{
				name: "camera-shutter-audio",
				path: cameraShutterAudioPath,
				type: "audio",
			},
			{
				name: "electricity-audio",
				path: electricityAudioPath,
				type: "audio",
			},
			{
				name: "winter-breeze-audio",
				path: winterBreezeAudioPath,
				type: "audio",
			},
			{
				name: "knock-door-audio",
				path: knockDoorAudioPath,
				type: "audio",
			},
			{
				name: "ac-audio",
				path: acAudioPath,
				type: "audio",
			},
			{
				name: "fire-audio",
				path: fireAudioPath,
				type: "audio",
			},
			{
				name: "notification-audio",
				path: notificationAudioPath,
				type: "audio",
			},
			{
				name: "door-open-audio",
				path: doorOpenAudioPath,
				type: "audio",
			},
			{
				name: "door-close-audio",
				path: doorCloseAudioPath,
				type: "audio",
			},
		],
		onReady: async (_app) => {
			const appWorker = _app.module.getWorker() as Worker;
			const appThread = _app.module.getThread();
			const audioListener = new AudioListener();

			if (import.meta.env.DEV) {
				const paneRef = new Pane();
				const statsRef = new Stats();

				configureTweakpane(paneRef, (type, value) =>
					appWorker.postMessage({ type: `$tweakpane-${type}`, value })
				);
				document.body.appendChild(statsRef.dom);

				appThread?.getBeforeStep$().subscribe(() => {
					statsRef?.begin();
				});

				appThread?.getStep$()?.subscribe(() => {
					statsRef?.end();
				});
			}

			_app.module.loader
				.getLoad$()
				.subscribe(({ loadedCount, toLoadCount, source }) => {
					const progressBar = document.querySelector(
						".loader-view .progress-bar"
					) as HTMLDivElement;
					const progressTextHeader = document.querySelector(
						".loader-view .text-header"
					) as HTMLDivElement;
					const progressTextBody = document.querySelector(
						".loader-view .text-body"
					) as HTMLDivElement;

					if (progressBar)
						progressBar.style.width = `${(loadedCount / toLoadCount) * 100}%`;
					if (progressTextHeader)
						progressTextHeader.textContent = `${loadedCount} / ${toLoadCount}`;
					if (progressTextBody)
						progressTextBody.textContent = `${source.type}: ${source.name} Loaded`;
				});

			_app.module.loader.getLoadCompleted$().subscribe(() => {
				const characterName = "JOHN";
				const progressTextBody = document.querySelector(
					".loader-view .text-body"
				) as HTMLDivElement;
				const startExperienceButton = document.querySelector(
					".loader-view button.start-experience"
				) as HTMLButtonElement;
				const gameStartAudioBuffer = _app.module.loader.getLoadedResources()[
					"game-start-audio"
				] as AudioBuffer;
				const menuSelectionAudioBuffer =
					_app.module.loader.getLoadedResources()[
						"menu-selection-audio"
					] as AudioBuffer;
				const menuSelection2AudioBuffer =
					_app.module.loader.getLoadedResources()[
						"menu-selection-action-audio"
					] as AudioBuffer;
				const cameraShutterAudioBuffer =
					_app.module.loader.getLoadedResources()[
						"camera-shutter-audio"
					] as AudioBuffer;
				const electricityAudioBuffer = _app.module.loader.getLoadedResources()[
					"electricity-audio"
				] as AudioBuffer;
				const winterBreezeAudioBuffer = _app.module.loader.getLoadedResources()[
					"winter-breeze-audio"
				] as AudioBuffer;
				const knockDoorAudioBuffer = _app.module.loader.getLoadedResources()[
					"knock-door-audio"
				] as AudioBuffer;
				const acAudioBuffer = _app.module.loader.getLoadedResources()[
					"ac-audio"
				] as AudioBuffer;
				const fireAudioBuffer = _app.module.loader.getLoadedResources()[
					"fire-audio"
				] as AudioBuffer;
				const notificationAudioBuffer = _app.module.loader.getLoadedResources()[
					"notification-audio"
				] as AudioBuffer;
				const doorOpenAudioBuffer = _app.module.loader.getLoadedResources()[
					"door-open-audio"
				] as AudioBuffer;
				const doorCloseAudioBuffer = _app.module.loader.getLoadedResources()[
					"door-close-audio"
				] as AudioBuffer;
				const gameStartAudio = new Audio(audioListener);
				const menuSelectionAudio = new Audio(audioListener);
				const menuSelection2Audio = new Audio(audioListener);
				const cameraShutterAudio = new Audio(audioListener);
				const knockDoorAudio = new Audio(audioListener);
				const electricityAudio = new PositionalAudio(audioListener);
				const winterBreezeAudio = new PositionalAudio(audioListener);
				const acAudio = new PositionalAudio(audioListener);
				const fireAudio = new PositionalAudio(audioListener);
				const notificationAudio = new Audio(audioListener);
				const doorOpenAudio = new Audio(audioListener);
				const doorCloseAudio = new Audio(audioListener);

				gameStartAudio.setBuffer(gameStartAudioBuffer);
				menuSelectionAudio.setBuffer(menuSelectionAudioBuffer);
				menuSelectionAudio.setVolume(0.5);
				menuSelection2Audio.setBuffer(menuSelection2AudioBuffer);
				menuSelection2Audio.setVolume(0.4);
				cameraShutterAudio.setBuffer(cameraShutterAudioBuffer);
				cameraShutterAudio.setVolume(0.5);
				knockDoorAudio.setBuffer(knockDoorAudioBuffer);
				knockDoorAudio.setVolume(1);
				electricityAudio.setBuffer(electricityAudioBuffer);
				electricityAudio.setLoop(true);
				electricityAudio.setVolume(0.3);
				winterBreezeAudio.setBuffer(winterBreezeAudioBuffer);
				winterBreezeAudio.setLoop(true);
				winterBreezeAudio.setVolume(0.2);
				acAudio.setBuffer(acAudioBuffer);
				acAudio.setLoop(true);
				acAudio.setVolume(0.05);
				fireAudio.setBuffer(fireAudioBuffer);
				fireAudio.setLoop(true);
				fireAudio.setVolume(0.12);
				notificationAudio.setBuffer(notificationAudioBuffer);
				notificationAudio.setVolume(0.7);
				doorOpenAudio.setBuffer(doorOpenAudioBuffer);
				doorOpenAudio.setVolume(0.5);
				doorCloseAudio.setBuffer(doorCloseAudioBuffer);
				doorCloseAudio.setVolume(0.5);

				startExperienceButton.addEventListener("click", () => {
					gameStartAudio.stop();
					gameStartAudio.play();
					appWorker.postMessage({ type: "start-experience" });
					removeLoaderView();
					const {
						container,
						cameraAngleButton,
						cameraPositionButton,
						eventsOpenCurtainButton,
						eventsBreakTVButton,
						eventsTurnOnACButton,
						eventsTurnOffElectricityButton,
						eventsKitchenFireButton,
						eventsKnockDoor1Button,
						eventsKnockDoor2Button,
						showMessage,
					} = createExperienceControls();

					appWorker.addEventListener("message", (event) => {
						const { token, type } = event.data as {
							token: string;
							type: HomeEventType;
						};

						if (token === "home-event") {
							if (type === "tvCrashed") electricityAudio.play();
							if (type === "tvRestored") electricityAudio.stop();
							if (type === "curtainsOpened") winterBreezeAudio.play();
							if (type === "curtainsClosed") winterBreezeAudio.stop();
							if (type === "door1Knocked") knockDoorAudio.play();
							if (type === "door2Knocked") knockDoorAudio.play();
							if (type === "acStarted") acAudio.play();
							if (type === "acStopped") acAudio.stop();
							if (type === "kitchenInFire") fireAudio.play();
							if (type === "kitchenFireExtinguished") fireAudio.stop();
						}

						if (token === "character-event") {
							notificationAudio.stop();
							notificationAudio.play();

							if (type === "tvCrashed")
								showMessage(`${characterName}: Oh no! the TV is broken!`);
							if (type === "curtainsOpened")
								showMessage(`${characterName}: I can see outside, it's cold!`);
							if (type === "acStarted")
								showMessage(`${characterName}: It's getting chilly in here!`);
							if (type === "door1Knocked")
								showMessage(`${characterName}: Who's at the door?`);
							if (type === "door2Knocked")
								showMessage(`${characterName}: Hummm... Someone in my house?`);
							if (type === "kitchenInFire")
								showMessage(
									`${characterName}: The kitchen is on fire!!! I need to help!`
								);
							if (type === "electricityShutdown")
								showMessage(
									`${characterName}: The lights are out! I need to find a flashlight!`
								);
						}

						if (token === "character-performed-event") {
							notificationAudio.stop();
							notificationAudio.play();

							if (type === "door1Knocked")
								showMessage(`${characterName}: Weird... Maybe the wind?`);
							if (type === "door2Knocked")
								showMessage(`${characterName}: I thought I heard someone...`);
							if (type === "tvCrashed")
								showMessage(`${characterName}: Ouf! It's back on!`);
							if (type === "kitchenInFire")
								showMessage(`${characterName}: The fire is out!`);
							if (type === "electricityShutdown")
								showMessage(`${characterName}: The lights are back on!`);
						}

						if (token === "door-open") {
							doorOpenAudio.stop();
							doorOpenAudio.play();
						}
						if (token === "door-close") {
							doorCloseAudio.stop();
							doorCloseAudio.play();
						}
					});

					container.querySelectorAll("button").forEach((child) => {
						if (!(child instanceof HTMLButtonElement)) return;
						child.addEventListener("mouseenter", () => {
							menuSelectionAudio.stop();
							menuSelectionAudio.play();
						});
						child.addEventListener("pointerdown", () => {
							if (
								child.classList.contains("angle") ||
								child.classList.contains("position")
							) {
								cameraShutterAudio.stop();
								cameraShutterAudio.play();
								return;
							}
							menuSelection2Audio.stop();
							menuSelection2Audio.play();
						});
					});

					cameraAngleButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "switch-camera-angle",
						});
					});
					cameraPositionButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "switch-camera-position",
						});
					});
					eventsOpenCurtainButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "curtainsOpened",
						});
					});
					eventsBreakTVButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "tvCrashed",
						});
					});
					eventsTurnOnACButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "acStarted",
						});
					});
					eventsTurnOffElectricityButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "electricityShutdown",
						});
					});
					eventsKitchenFireButton.addEventListener("click", () => {
						appWorker.postMessage({
							type: "kitchenInFire",
						});
					});
					eventsKnockDoor1Button.addEventListener("click", () => {
						appWorker.postMessage({
							type: "door1Knocked",
						});
					});
					eventsKnockDoor2Button.addEventListener("click", () => {
						appWorker.postMessage({
							type: "door2Knocked",
						});
					});
				});

				setTimeout(() => {
					if (progressTextBody)
						progressTextBody.textContent = `Loading Completed`;
					document.querySelector(".loader-view")?.classList.add("completed");
				}, 500);
			});
		},
	});

registerApp();
