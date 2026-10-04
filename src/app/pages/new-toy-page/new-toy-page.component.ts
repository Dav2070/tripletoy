import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	OnDestroy
} from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Address, Toy, ToyPhoto } from "src/app/misc/types"
import { getToyPhotoUrl, parsePriceToCents } from "src/app/misc/utils"
import {
	toyPriceMax,
	toyPriceMin,
	toyPhotoMaxBytes,
	toyPhotoMaxCount,
	toyPhotoTypes
} from "src/constants/constants"

interface SelectedPhoto {
	file: File
	previewUrl: string
}

@Component({
	templateUrl: "./new-toy-page.component.html",
	styleUrl: "./new-toy-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewToyPageComponent implements OnDestroy {
	locale = this.localizationService.locale.newToyPage
	profileLocale = this.localizationService.locale.profileEditPage
	userLocale = this.localizationService.locale.userPage
	title: string = ""
	titleError: string = ""
	description: string = ""
	price: string = ""
	priceError: string = ""
	photos: SelectedPhoto[] = []
	photoTypes = toyPhotoTypes.join(",")
	photoError: string = ""
	// The address is needed to sell toys, it is asked for if the profile has none
	needsAddress: boolean = false
	address: Address = {
		name: "",
		line1: "",
		line2: "",
		postalCode: "",
		city: "",
		country: "Deutschland"
	}
	addressError: string = ""
	// Set when an existing toy is edited
	editUuid: string = null
	existingPhotos: ToyPhoto[] = []
	notEditable: boolean = false
	getPhotoUrl = getToyPhotoUrl
	// The toy is created only once, even if uploading the photos has to be retried
	createdToy: Toy = null
	error: string = ""
	loading: boolean = false

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	get isEdit(): boolean {
		return this.editUuid != null
	}

	get photoCount(): number {
		return this.existingPhotos.length + this.photos.length
	}

	async ngOnInit() {
		this.editUuid = this.activatedRoute.snapshot.paramMap.get("uuid")

		await this.dataService.userPromiseHolder.AwaitResult()

		if (!this.dataService.dav.isLoggedIn) return

		if (this.isEdit) {
			await this.loadToy()
		} else {
			await this.loadProfile()
		}
	}

	private async loadProfile() {
		try {
			const profile = await this.apiService.retrieveMyProfile()

			this.needsAddress = !this.isAddressComplete(profile.address)
		} catch (error) {
			console.error(error)

			// The API ignores the address if the profile already has one
			this.needsAddress = true
		}
	}

	/** A shipping address needs everything except the second address line */
	private isAddressComplete(address: Partial<Address> | null): boolean {
		return (["name", "line1", "postalCode", "city", "country"] as const).every(
			key => (address?.[key] ?? "").trim().length > 0
		)
	}

	addressChange(field: keyof Address, event: Event) {
		this.address[field] = (event as CustomEvent).detail.value
		this.addressError = ""
	}

	private async loadToy() {
		this.loading = true
		let toy: Toy = null

		try {
			toy = await this.apiService.retrieveToy(this.editUuid)
		} catch (error) {
			console.error(error)
		}

		if (toy == null || !toy.mine || toy.sold) {
			this.notEditable = true
		} else {
			this.title = toy.title
			this.description = toy.description ?? ""
			this.price = (toy.price / 100).toString().replace(".", ",")
			this.existingPhotos = toy.photos
		}

		this.loading = false
	}

	titleChange(event: Event) {
		this.title = (event as CustomEvent).detail.value
		this.titleError = ""
	}

	descriptionChange(event: Event) {
		this.description = (event as CustomEvent).detail.value
	}

	priceChange(event: Event) {
		this.price = (event as CustomEvent).detail.value
		this.priceError = ""
	}

	photosSelected(event: Event) {
		const input = event.target as HTMLInputElement
		this.photoError = ""

		for (const file of Array.from(input.files ?? [])) {
			if (this.photoCount >= toyPhotoMaxCount) {
				this.photoError = this.locale.tooManyPhotos
				break
			}

			if (
				!toyPhotoTypes.includes(file.type) ||
				file.size > toyPhotoMaxBytes
			) {
				this.photoError = this.locale.photoInvalid
				continue
			}

			this.photos.push({ file, previewUrl: URL.createObjectURL(file) })
		}

		// Allow selecting the same file again
		input.value = ""
	}

	removePhoto(photo: SelectedPhoto) {
		URL.revokeObjectURL(photo.previewUrl)
		this.photos = this.photos.filter(p => p != photo)
		this.photoError = ""
	}

	async removeExistingPhoto(photo: ToyPhoto) {
		this.photoError = ""
		this.loading = true

		try {
			await this.apiService.deleteToyPhoto(this.editUuid, photo.uuid)
			this.existingPhotos = this.existingPhotos.filter(p => p != photo)
		} catch (error) {
			console.error(error)
			this.photoError = this.locale.saveError
		}

		this.loading = false
	}

	ngOnDestroy() {
		this.photos.forEach(p => URL.revokeObjectURL(p.previewUrl))
	}

	navigateToUserPage() {
		this.routingService.navigateToUserPage()
	}

	private handleError(error: unknown) {
		const codes: string[] = CombinedGraphQLErrors.is(error)
			? error.errors.flatMap(e => (e.extensions?.["errors"] as string[]) ?? [])
			: []

		if (codes.some(c => c.startsWith("TITLE_"))) {
			this.titleError = this.locale.titleInvalid
		}

		if (codes.includes("ADDRESS_REQUIRED")) {
			this.addressError = this.locale.addressRequired
		} else if (codes.includes("ADDRESS_INVALID")) {
			this.addressError = this.profileLocale.addressTooLong
		}

		if (codes.includes("PRICE_INVALID")) {
			this.priceError = this.locale.priceInvalid
		}

		const apiCodes: string[] = CombinedGraphQLErrors.is(error)
			? error.errors.map(e => e.extensions?.["code"] as string)
			: []

		if (apiCodes.includes("TOY_ALREADY_SOLD")) {
			this.notEditable = true
		} else if (codes.includes("DESCRIPTION_TOO_LONG")) {
			this.error = this.locale.descriptionTooLong
		} else if (codes.length == 0) {
			this.error = this.isEdit ? this.locale.saveError : this.locale.error
		}
	}

	async submit() {
		this.error = ""

		const title = this.title.trim()

		const price = parsePriceToCents(this.price)

		this.titleError = title.length == 0 ? this.locale.titleRequired : ""
		this.priceError =
			price == null || price < toyPriceMin || price > toyPriceMax
				? this.locale.priceInvalid
				: ""

		this.addressError =
			this.needsAddress && !this.isAddressComplete(this.address)
				? this.locale.addressRequired
				: ""

		if (this.titleError || this.priceError || this.addressError) return

		this.loading = true

		try {
			if (this.isEdit) {
				this.createdToy = await this.apiService.updateToy({
					uuid: this.editUuid,
					title,
					description: this.description.trim() || undefined,
					price
				})

				if (this.createdToy == null) throw new Error("No toy returned")
			} else if (this.createdToy == null) {
				this.createdToy = await this.apiService.createToy({
					title,
					description: this.description.trim() || undefined,
					price,
					address: this.needsAddress ? this.address : undefined
				})

				if (this.createdToy == null) throw new Error("No toy returned")
			}
		} catch (error) {
			console.error(error)
			this.handleError(error)
			this.loading = false
			return
		}

		// Upload the photos one by one, uploaded photos are removed from the list
		for (const photo of [...this.photos]) {
			try {
				await this.apiService.uploadToyPhoto(this.createdToy.uuid, photo.file)
				this.removePhoto(photo)
			} catch (error) {
				console.error(error)
				this.error = this.locale.photoUploadError
				this.loading = false
				return
			}
		}

		this.routingService.navigateToToyPage(this.createdToy.uuid)
		this.loading = false
	}
}
