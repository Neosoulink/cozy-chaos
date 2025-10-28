import { NoToneMapping, SRGBColorSpace } from "three";

export const DEFAULT_RENDERER_CONFIG = {
	antialias: true,
	autoClear: true,
	clearAlpha: 1,
	clearColor: "#262a2b",
	outputColorSpace: SRGBColorSpace,
	toneMapping: NoToneMapping,
	toneExposure: 0.5,
};
