export interface ToyPhoto {
	uuid: string
	/** Path on the API server, e.g. /photos/<file>.jpg */
	url: string
}

export interface ToyOrder {
	name: string
	email: string
	phone: string | null
	line1: string
	line2: string | null
	postalCode: string
	city: string
	state: string | null
	country: string
	createdAt: string
}

export interface Toy {
	uuid: string
	title: string
	description: string | null
	price: number
	photos: ToyPhoto[]
	sold: boolean
	/** Distance in km to the seller, only set when the list is sorted by distance */
	distance?: number | null
	/** Whether the logged in user is the seller */
	mine: boolean
	/** Whether the logged in user has bought the toy */
	bought?: boolean
	/** The order of the toy, only returned to the seller */
	order?: ToyOrder | null
	createdAt: string
	updatedAt: string
}

export interface List<T> {
	total: number
	items: T[]
}

export interface Address {
	name: string | null
	line1: string | null
	line2: string | null
	postalCode: string | null
	city: string | null
	country: string | null
}

export interface ToyStats {
	active: number
	sold: number
	bought: number
	/** Collected coins: 15 per purchase and 10 per sale */
	coins: number
}

export interface Profile {
	/** The age in years, calculated by the API from the birth date */
	age: number | null
	/** The birth date as YYYY-MM-DD */
	birthDate: string | null
	description: string | null
	phone: string | null
	address: Address
}

/** A position on the map */
export interface Position {
	latitude: number
	longitude: number
}

/** A toy for sale at the approximate position of its seller */
export interface ToyLocation {
	uuid: string
	title: string
	price: number
	latitude: number
	longitude: number
	photo: ToyPhoto | null
}
