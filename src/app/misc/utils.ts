import { ToyPhoto } from "src/app/misc/types"
import { environment } from "src/environments/environment"

/** Formats a price given in cents as Euro */
export function formatPrice(cents: number, language: string = "de"): string {
	return new Intl.NumberFormat(language, {
		style: "currency",
		currency: "EUR"
	}).format(cents / 100)
}

/** Returns the absolute url of a photo stored on the API server */
export function getToyPhotoUrl(photo: ToyPhoto): string {
	return environment.tripletoyApiUrl + photo.url
}

/** Converts a price input like "12,50" to cents, returns null if invalid */
export function parsePriceToCents(value: string): number | null {
	const price = Number(value.trim().replace(",", "."))
	if (value.trim() == "" || !Number.isFinite(price) || price < 0) return null

	return Math.round(price * 100)
}
