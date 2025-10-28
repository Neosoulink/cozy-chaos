import { CHARACTER_WALKING_PATHS } from "../constants/character.constant";

export type CharacterWalkingPath =
	(typeof CHARACTER_WALKING_PATHS)[number]["name"];
