import { ToyPhoto } from "src/app/misc/types"
import { environment } from "src/environments/environment"

/** Formats a price given in cents as Euro */
export function formatPrice(cents: number, language: string = "de"): string {
	return new Intl.NumberFormat(language, {
		style: "currency",
		currency: "EUR"
	}).format(cents / 100)
}

/** The API returns absolute urls for photos in DigitalOcean Spaces and paths for local photos */
function getAbsoluteApiUrl(url: string): string {
	return /^https?:\/\//.test(url) ? url : environment.tripletoyApiUrl + url
}

/** Returns the absolute url of a photo of a toy */
export function getToyPhotoUrl(photo: ToyPhoto): string {
	return getAbsoluteApiUrl(photo.url)
}

/** Returns the absolute url of a drawing */
export function getDrawingUrl(drawing: { url: string }): string {
	return getAbsoluteApiUrl(drawing.url)
}

/** Converts a price input like "12,50" to cents, returns null if invalid */
export function parsePriceToCents(value: string): number | null {
	const price = Number(normalizeDigits(value.trim()).replace(",", "."))
	if (value.trim() == "" || !Number.isFinite(price) || price < 0) return null

	return Math.round(price * 100)
}

/** Replaces Persian and Arabic digits and decimal separators, as typed on a Persian keyboard */
export function normalizeDigits(value: string): string {
	return value
		.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
		.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
		.replace(/[٫/]/g, ".")
		.replace(/٬/g, "")
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
