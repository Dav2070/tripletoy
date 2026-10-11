import { Injectable, Inject, PLATFORM_ID } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { Dav, PromiseHolder, defaultProfileImageUrl } from "dav-js"
import * as DavUIComponents from "dav-ui-components"
import { keys } from "src/constants/keys"

@Injectable({ providedIn: "root" })
export class DataService {
	dav = Dav
	isMobile: boolean = false
	darkTheme: boolean = false
	userPromiseHolder = new PromiseHolder()

	get profileImageUrl(): string {
		return this.dav.user?.ProfileImage || defaultProfileImageUrl
	}

	constructor(@Inject(PLATFORM_ID) private platformId: object) {}

	applyTheme() {
		if (!isPlatformBrowser(this.platformId)) return

		const colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)")
		this.darkTheme = colorScheme?.matches ?? false

		if (colorScheme) {
			colorScheme.onchange = () => this.applyTheme()
		}

		document.body.setAttribute(
			keys.themeKey,
			this.darkTheme ? keys.darkThemeKey : keys.lightThemeKey
		)

		DavUIComponents.setTheme(
			this.darkTheme
				? DavUIComponents.Theme.dark
				: DavUIComponents.Theme.light
		)
	}
}
