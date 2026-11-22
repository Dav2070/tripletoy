import {
	Injectable,
	Inject,
	Optional,
	PLATFORM_ID,
	REQUEST,
	DOCUMENT,
	TransferState,
	makeStateKey
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import { Meta } from "@angular/platform-browser"
import * as locales from "src/locales/locales"
import { Language } from "../misc/types"
import { keys } from "src/constants/keys"

const renderedLanguage = makeStateKey<string>("tripletoy.language")

/** The languages the app has locales for */
const supportedLanguages: string[] = Object.values(Language)

/** Used if neither the browser nor the request tell us a language */
const defaultLanguageTag = "de"

@Injectable({ providedIn: "root" })
export class LocalizationService {
	locale = locales.deDE
	/** The language the interface is displayed in */
	language: Language = Language.de
	/** The language chosen by the user, null if the browser language is used */
	selectedLanguage: Language | null = null
	private browser = false

	constructor(
		@Inject(PLATFORM_ID) platformId: object,
		@Inject(DOCUMENT) document: Document,
		@Optional() @Inject(REQUEST) request: Request | null,
		transferState: TransferState,
		meta: Meta
	) {
		const browser = isPlatformBrowser(platformId)
		this.browser = browser
		if (browser) this.selectedLanguage = loadSelectedLanguage()

		const preferred = browser
			? preferredLanguageTag(navigator.languages?.join(",") ?? navigator.language)
			: preferredLanguageTag(request?.headers.get("accept-language") ?? null)

		// Hydrate with the exact locale used for the server markup, otherwise the
		// texts would switch after loading the page. The language chosen by the
		// user is only known in the browser, so it replaces the server texts.
		const tag = browser
			? (selectedLanguageTag(this.selectedLanguage, preferred) ??
				transferState.get(renderedLanguage, preferred ?? defaultLanguageTag))
			: (preferred ?? defaultLanguageTag)
		if (!browser) transferState.set(renderedLanguage, tag)

		this.locale = this.getLocale(tag)
		this.language = getLanguage(tag)

		// index.html is German, update it for the chosen language
		document.documentElement.lang = this.language
		document.documentElement.dir = this.isRtl ? "rtl" : "ltr"
		meta.updateTag({
			name: "description",
			content: this.locale.misc.metaDescription
		})
	}

	/**
	 * Saves the language chosen by the user in the browser, or removes it to use
	 * the browser language again, and reloads the page to show the new texts
	 */
	selectLanguage(language: Language | null) {
		if (!this.browser) return

		try {
			if (language == null) {
				localStorage.removeItem(keys.languageKey)
			} else {
				localStorage.setItem(keys.languageKey, language)
			}
		} catch {
			// Storage can be blocked, e.g. in private windows
			return
		}

		window.location.reload()
	}

	/** If the interface is written from right to left */
	get isRtl() {
		return this.language == Language.fa
	}

	private getLocale(language: string) {
		const locale = language.toLowerCase()

		if (locale.startsWith("en")) {
			if (locale == "en-gb") return locales.enGB
			return locales.enUS
		} else if (locale.startsWith("de")) {
			if (locale == "de-at") return locales.deAT
			if (locale == "de-ch") return locales.deCH
			return locales.deDE
		} else if (locale.startsWith("fa")) {
			return locales.faIR
		}

		return locales.enUS
	}
}

/** Reads the language chosen by the user, null if none or an unknown one is saved */
function loadSelectedLanguage(): Language | null {
	try {
		const language = localStorage.getItem(keys.languageKey)
		return language != null && supportedLanguages.includes(language)
			? (language as Language)
			: null
	} catch {
		return null
	}
}

/** Keeps the region of the browser language (e.g. de-AT) if the user chose the same language */
function selectedLanguageTag(
	selected: Language | null,
	preferred: string | null
): string | null {
	if (selected == null) return null
	return preferred?.startsWith(selected) ? preferred : selected
}

function getLanguage(tag: string): Language {
	const language = tag.toLowerCase().slice(0, 2)
	return supportedLanguages.includes(language)
		? (language as Language)
		: Language.en
}

/**
 * Picks the language tag to render in out of an Accept-Language header such as
 * "de-AT,de;q=0.9,en-US;q=0.8". Only the languages the app has locales for are
 * considered, so a visitor whose first choice is French but who also
 * understands German gets the German interface rather than the fallback.
 * Returns "en" for headers without any supported language.
 */
function preferredLanguageTag(header: string | null): string | null {
	if (header == null || header.trim().length == 0) return null

	const candidates = header
		.split(",")
		.map(part => {
			const [tag, ...parameters] = part.trim().split(";")
			const quality = parameters
				.map(parameter => parameter.trim())
				.find(parameter => parameter.startsWith("q="))

			return {
				tag: tag.trim().toLowerCase(),
				quality: quality == null ? 1 : Number(quality.slice(2))
			}
		})
		.filter(
			candidate =>
				candidate.tag.length > 0 &&
				Number.isFinite(candidate.quality) &&
				candidate.quality > 0 &&
				supportedLanguages.includes(candidate.tag.slice(0, 2))
		)
		// Stable sort, so equal qualities keep the order of the header
		.sort((a, b) => b.quality - a.quality)

	return candidates[0]?.tag ?? Language.en
}
