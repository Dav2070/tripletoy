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

/** Returns the absolute url of a drawing stored on the API server */
export function getDrawingUrl(drawing: { url: string }): string {
	return environment.tripletoyApiUrl + drawing.url
}

/** Converts a price input like "12,50" to cents, returns null if invalid */
export function parsePriceToCents(value: string): number | null {
	const price = Number(value.trim().replace(",", "."))
	if (value.trim() == "" || !Number.isFinite(price) || price < 0) return null

	return Math.round(price * 100)
}

/** Converts an ISO date and time to the value of a datetime-local input, in the local time zone */
export function toDateTimeLocal(iso: string | null): string {
	if (iso == null) return ""

	const date = new Date(iso)
	if (isNaN(date.getTime())) return ""

	const pad = (n: number) => n.toString().padStart(2, "0")

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Converts the value of a datetime-local input to an ISO date and time, null if empty or invalid */
export function fromDateTimeLocal(value: string): string | null {
	const date = new Date(value)
	return value.trim() == "" || isNaN(date.getTime()) ? null : date.toISOString()
}
