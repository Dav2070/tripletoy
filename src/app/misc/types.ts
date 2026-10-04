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

export interface Profile {
	age: number | null
	description: string | null
	phone: string | null
	address: Address
}
