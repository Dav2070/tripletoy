import { Injectable } from "@angular/core"
import * as locales from "src/locales/locales"

@Injectable({ providedIn: "root" })
export class LocalizationService {
	locale = locales.deDE
	/** The language the interface is displayed in */
	language: "de" | "en" = "de"

	constructor() {
		const preferred = navigator.languages?.[0] ?? navigator.language ?? "de"

		if (!preferred.toLowerCase().startsWith("de")) {
			this.locale = locales.enUS
			this.language = "en"
		}
	}
}
