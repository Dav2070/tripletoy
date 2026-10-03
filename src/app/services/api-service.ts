import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"
import { firstValueFrom } from "rxjs"
import { List, Toy } from "src/app/misc/types"

const toyFields = `
	uuid
	title
	description
	price
	createdAt
	updatedAt
`

@Injectable({ providedIn: "root" })
export class ApiService {
	constructor(private apollo: Apollo) {}

	async listToys(limit: number, offset: number): Promise<List<Toy>> {
		const result = await firstValueFrom(
			this.apollo.query<{ listToys: List<Toy> }>({
				query: gql`
					query ListToys($limit: Int, $offset: Int) {
						listToys(limit: $limit, offset: $offset) {
							total
							items {
								${toyFields}
							}
						}
					}
				`,
				variables: { limit, offset },
				fetchPolicy: "no-cache"
			})
		)

		return result.data?.listToys ?? { total: 0, items: [] }
	}

	async retrieveToy(uuid: string): Promise<Toy | null> {
		const result = await firstValueFrom(
			this.apollo.query<{ retrieveToy: Toy | null }>({
				query: gql`
					query RetrieveToy($uuid: String!) {
						retrieveToy(uuid: $uuid) {
							${toyFields}
						}
					}
				`,
				variables: { uuid },
				fetchPolicy: "no-cache"
			})
		)

		return result.data?.retrieveToy ?? null
	}

	/** Creates a toy for the logged in user */
	async createToy(params: {
		title: string
		description?: string
		price: number
	}): Promise<Toy | null> {
		const result = await firstValueFrom(
			this.apollo.mutate<{ createToy: Toy }>({
				mutation: gql`
					mutation CreateToy(
						$title: String!
						$description: String
						$price: Int!
					) {
						createToy(
							title: $title
							description: $description
							price: $price
						) {
							${toyFields}
						}
					}
				`,
				variables: params
			})
		)

		return result.data?.createToy ?? null
	}
}
