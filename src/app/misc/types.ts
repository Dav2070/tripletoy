export interface Toy {
	uuid: string
	title: string
	description: string | null
	price: number
	createdAt: string
	updatedAt: string
}

export interface List<T> {
	total: number
	items: T[]
}
