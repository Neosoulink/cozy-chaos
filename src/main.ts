import { register } from "@quick-threejs/reactive";
import Stats from "stats.js";
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

import "./style.css";
import { configureTweakpane } from "./shared/utils/tweakpane.util";

const isDev = import.meta.env.DEV;
const location = new URL(
	`./core/core.worker.${isDev ? "ts" : "js"}`,
	import.meta.url
) as unknown as string;

if (isDev) console.log("🚧 worker location:", location);

const registerApp = () =>
	register({
		location,
		enableDebug: true,
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
		],
		onReady: async (_app) => {
			const appWorker = _app.module.getWorker() as Worker;
			const appThread = _app.module.getThread();

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
		},
	});

registerApp();
