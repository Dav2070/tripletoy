import { Injectable } from "@angular/core"
import { Apollo, gql } from "apollo-angular"
import { HttpClient } from "@angular/common/http"
import { firstValueFrom } from "rxjs"
import { Dav } from "dav-js"
import { List, Profile, Toy, ToyPhoto } from "src/app/misc/types"
import { environment } from "src/environments/environment"

const toyFields = `
	uuid
	title
	description
	price
	photos {
		uuid
		url
	}
	sold
	mine
	createdAt
	updatedAt
`

@Injectable({ providedIn: "root" })
export class ApiService {
	constructor(
		private apollo: Apollo,
		private http: HttpClient
	) {}

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

	/** Lists the toys of the logged in user */
	async listMyToys(limit: number, offset: number): Promise<List<Toy>> {
		const result = await firstValueFrom(
			this.apollo.query<{ listMyToys: List<Toy> }>({
				query: gql`
					query ListMyToys($limit: Int, $offset: Int) {
						listMyToys(limit: $limit, offset: $offset) {
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

		return result.data?.listMyToys ?? { total: 0, items: [] }
	}

	async retrieveToy(uuid: string): Promise<Toy | null> {
		const result = await firstValueFrom(
			this.apollo.query<{ retrieveToy: Toy | null }>({
				query: gql`
					query RetrieveToy($uuid: String!) {
						retrieveToy(uuid: $uuid) {
							${toyFields}
							order {
								name
								email
								phone
								line1
								line2
								postalCode
								city
								state
								country
								createdAt
							}
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

	/** Updates a toy of the logged in user that has not been sold yet */
	async updateToy(params: {
		uuid: string
		title: string
		description?: string
		price: number
	}): Promise<Toy | null> {
		const result = await firstValueFrom(
			this.apollo.mutate<{ updateToy: Toy }>({
				mutation: gql`
					mutation UpdateToy(
						$uuid: String!
						$title: String!
						$description: String
						$price: Int!
					) {
						updateToy(
							uuid: $uuid
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

		return result.data?.updateToy ?? null
	}

	/** Deletes a toy of the logged in user that has not been sold yet */
	async deleteToy(uuid: string): Promise<void> {
		await firstValueFrom(
			this.apollo.mutate<{ deleteToy: boolean }>({
				mutation: gql`
					mutation DeleteToy($uuid: String!) {
						deleteToy(uuid: $uuid)
					}
				`,
				variables: { uuid }
			})
		)
	}

	/** Creates the Stripe checkout session for buying a toy and returns its url */
	async createToyCheckoutSession(params: {
		uuid: string
		successUrl: string
		cancelUrl: string
	}): Promise<string> {
		const result = await firstValueFrom(
			this.apollo.mutate<{ createToyCheckoutSession: { url: string } }>({
				mutation: gql`
					mutation CreateToyCheckoutSession(
						$uuid: String!
						$successUrl: String!
						$cancelUrl: String!
					) {
						createToyCheckoutSession(
							uuid: $uuid
							successUrl: $successUrl
							cancelUrl: $cancelUrl
						) {
							url
						}
					}
				`,
				variables: params
			})
		)

		const url = result.data?.createToyCheckoutSession?.url
		if (!url) throw new Error("No checkout url returned")

		return url
	}

	/** Retrieves the profile of the logged in user */
	async retrieveMyProfile(): Promise<Profile> {
		const result = await firstValueFrom(
			this.apollo.query<{ retrieveMyProfile: Profile }>({
				query: gql`
					query RetrieveMyProfile {
						retrieveMyProfile {
							age
							description
						}
					}
				`,
				fetchPolicy: "no-cache"
			})
		)

		return result.data?.retrieveMyProfile ?? { age: null, description: null }
	}

	/** Saves the profile of the logged in user, empty values are cleared */
	async updateMyProfile(params: {
		age: number | null
		description: string | null
	}): Promise<Profile | null> {
		const result = await firstValueFrom(
			this.apollo.mutate<{ updateMyProfile: Profile }>({
				mutation: gql`
					mutation UpdateMyProfile($age: Int, $description: String) {
						updateMyProfile(age: $age, description: $description) {
							age
							description
						}
					}
				`,
				variables: params
			})
		)

		return result.data?.updateMyProfile ?? null
	}

	/** Uploads a photo to a toy of the logged in user */
	async uploadToyPhoto(toyUuid: string, file: File): Promise<ToyPhoto> {
		return await firstValueFrom(
			this.http.post<ToyPhoto>(
				`${environment.tripletoyApiUrl}/toys/${toyUuid}/photos`,
				file,
				{
					headers: {
						"Content-Type": file.type,
						Authorization: Dav.accessToken ?? ""
					}
				}
			)
		)
	}

	/** Deletes a photo of a toy of the logged in user */
	async deleteToyPhoto(toyUuid: string, photoUuid: string): Promise<void> {
		await firstValueFrom(
			this.http.delete(
				`${environment.tripletoyApiUrl}/toys/${toyUuid}/photos/${photoUuid}`,
				{ headers: { Authorization: Dav.accessToken ?? "" } }
			)
		)
	}
}
