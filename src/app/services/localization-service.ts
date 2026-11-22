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

	constructor(
		@Inject(PLATFORM_ID) platformId: object,
		@Inject(DOCUMENT) document: Document,
		@Optional() @Inject(REQUEST) request: Request | null,
		transferState: TransferState,
		meta: Meta
	) {
		const browser = isPlatformBrowser(platformId)
		const preferred = browser
			? preferredLanguageTag(navigator.languages?.join(",") ?? navigator.language)
			: preferredLanguageTag(request?.headers.get("accept-language") ?? null)

		// Hydrate with the exact locale used for the server markup,
		// otherwise the texts would switch after loading the page
		const tag = browser
			? transferState.get(renderedLanguage, preferred ?? defaultLanguageTag)
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
