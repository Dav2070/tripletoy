/** Formats a price given in cents as Euro */
export function formatPrice(cents: number, language: string = "de"): string {
	return new Intl.NumberFormat(language, {
		style: "currency",
		currency: "EUR"
	}).format(cents / 100)
}

/** Converts a price input like "12,50" to cents, returns null if invalid */
export function parsePriceToCents(value: string): number | null {
	const price = Number(value.trim().replace(",", "."))
	if (value.trim() == "" || !Number.isFinite(price) || price < 0) return null

	return Math.round(price * 100)
}
