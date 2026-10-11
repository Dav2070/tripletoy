import { Injectable, Inject, Optional, REQUEST } from "@angular/core"
import * as locales from "src/locales/locales"

@Injectable({ providedIn: "root" })
export class LocalizationService {
	locale = locales.deDE
	/** The language the interface is displayed in */
	language: "de" | "en" = "de"

	constructor(@Optional() @Inject(REQUEST) request: Request | null) {
		// On the server the language comes from the request
		const preferred =
			request?.headers.get("accept-language")?.split(",")[0] ??
			(typeof navigator != "undefined"
				? (navigator.languages?.[0] ?? navigator.language)
				: null) ??
			"de"

		if (!preferred.toLowerCase().startsWith("de")) {
			this.locale = locales.enUS
			this.language = "en"
		}
	}
}
