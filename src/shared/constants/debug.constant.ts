import {
	ACESFilmicToneMapping,
	AgXToneMapping,
	CineonToneMapping,
	CustomToneMapping,
	LinearSRGBColorSpace,
	LinearToneMapping,
	NeutralToneMapping,
	NoToneMapping,
	ReinhardToneMapping,
	SRGBColorSpace,
} from "three";
import { BindingParams } from "tweakpane";
import { DEFAULT_RENDERER_CONFIG } from "./renderer.constant";

export const DEBUG_PARAMS_OPTIONS: Record<
	string,
	Record<string, { default: unknown; config: BindingParams }>
> = {
	global: {
		enabled: {
			default: true,
			config: {},
		},
		reset: {
			default: "$button",
			config: {},
		},
	},
	colorManagement: {
		enabled: {
			default: true,
			config: {},
		},
	},
	renderer: {
		autoClear: {
			default: DEFAULT_RENDERER_CONFIG.autoClear,
			config: {},
		},
		clearAlpha: {
			default: DEFAULT_RENDERER_CONFIG.clearAlpha,
			config: { min: 0, max: 1, step: 0.0001 },
		},
		clearColor: {
			default: DEFAULT_RENDERER_CONFIG.clearColor,
			config: {},
		},
		outputColorSpace: {
			default: DEFAULT_RENDERER_CONFIG.outputColorSpace,
			config: {
				options: {
					SRGBColorSpace,
					LinearSRGBColorSpace,
				},
			},
		},
		toneMapping: {
			default: DEFAULT_RENDERER_CONFIG.toneMapping,
			config: {
				options: {
					NoToneMapping,
					LinearToneMapping,
					ReinhardToneMapping,
					CineonToneMapping,
					ACESFilmicToneMapping,
					AgXToneMapping,
					NeutralToneMapping,
					CustomToneMapping,
				},
			},
		},
		toneExposure: {
			default: DEFAULT_RENDERER_CONFIG.toneExposure,
			config: { min: 0, max: 1, step: 0.0001 },
		},
	},
};
