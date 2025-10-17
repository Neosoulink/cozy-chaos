import { register } from "@quick-threejs/reactive";
import Stats from "stats.js";
import { Pane } from "tweakpane";

import characterGltf from "@/assets/3D/character.glb?url";
import homeGltf from "@/assets/3D/home.glb?url";
import defaultAlbedoImg from "@/assets/textures/default-albedo.png?url";
import defaultEmissionImg from "@/assets/textures/default-emission.png?url";

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
		// mainThread: true,
		enableDebug: true,
		enableControls: true,
		axesSizes: 5,
		gridSizes: 10,
		withMiniCamera: false,
		loaderDataSources: [
			{
				name: "character",
				path: characterGltf,
				type: "gltf",
			},
			{
				name: "home",
				path: homeGltf,
				type: "gltf",
			},
			{
				name: "default-albedo",
				path: defaultAlbedoImg,
				type: "image",
			},
			{
				name: "default-emission",
				path: defaultEmissionImg,
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
