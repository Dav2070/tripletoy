import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { RouterLink } from "@angular/router"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Address } from "src/app/misc/types"
import {
	profileAddressFieldMaxLength,
	profileAgeMax,
	profilePhoneRegex
} from "src/constants/constants"

@Component({
	templateUrl: "./profile-edit-page.component.html",
	styleUrl: "./profile-edit-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfileEditPageComponent {
	locale = this.localizationService.locale.profileEditPage
	userLocale = this.localizationService.locale.userPage
	birthDate: string = ""
	birthDateError: string = ""
	description: string = ""
	descriptionError: string = ""
	address: Address = {
		name: "",
		line1: "",
		line2: "",
		postalCode: "",
		city: "",
		country: ""
	}
	addressError: string = ""
	phone: string = ""
	phoneError: string = ""
	error: string = ""
	loading: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.loadProfile()
		}
	}

	private async loadProfile() {
		this.loading = true

		try {
			const profile = await this.apiService.retrieveMyProfile()

			this.birthDate = profile.birthDate ?? ""
			this.description = profile.description ?? ""
			this.phone = profile.phone ?? ""

			for (const key of Object.keys(this.address)) {
				this.address[key] = profile.address?.[key] ?? ""
			}
		} catch (error) {
			console.error(error)
		}

		this.loading = false
	}

	birthDateChange(event: Event) {
		this.birthDate = (event as CustomEvent).detail.value
		this.birthDateError = ""
	}

	/** Checks that the date exists, is not in the future and not unrealistically long ago */
	private isBirthDateValid(value: string): boolean {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
		if (match == null) return false

		const [year, month, day] = match.slice(1).map(Number)
		const date = new Date(year, month - 1, day)

		if (
			date.getFullYear() != year ||
			date.getMonth() != month - 1 ||
			date.getDate() != day
		)
			return false

		const today = new Date()
		const oldest = new Date(
			today.getFullYear() - profileAgeMax,
			today.getMonth(),
			today.getDate()
		)

		return date <= today && date >= oldest
	}

	descriptionChange(event: Event) {
		this.description = (event as CustomEvent).detail.value
		this.descriptionError = ""
	}

	phoneChange(event: Event) {
		this.phone = (event as CustomEvent).detail.value
		this.phoneError = ""
	}

	addressChange(field: keyof Address, event: Event) {
		this.address[field] = (event as CustomEvent).detail.value
		this.addressError = ""
	}

	navigateToUserPage() {
		this.routingService.navigateToUserPage()
	}

	async save() {
		this.error = ""

		const birthDate = this.birthDate.trim()

		this.addressError = Object.values(this.address).some(
			v => (v ?? "").trim().length > profileAddressFieldMaxLength
		)
			? this.locale.addressTooLong
			: ""

		this.birthDateError =
			birthDate != "" && !this.isBirthDateValid(birthDate)
				? this.locale.birthDateInvalid
				: ""

		const phone = this.phone.trim()

		this.phoneError =
			phone != "" && !profilePhoneRegex.test(phone)
				? this.locale.phoneInvalid
				: ""

		if (this.birthDateError || this.addressError || this.phoneError) return

		this.loading = true

		try {
			await this.apiService.updateMyProfile({
				birthDate: birthDate || null,
				description: this.description.trim() || null,
				phone: phone || null,
				address: Object.fromEntries(
					Object.entries(this.address).map(([key, value]) => [
						key,
						(value ?? "").trim() || null
					])
				) as unknown as Address
			})

			// The profile page shows the saved values
			this.routingService.navigateToUserPage()
		} catch (error) {
			console.error(error)

			const codes: string[] = CombinedGraphQLErrors.is(error)
				? error.errors.flatMap(
						e => (e.extensions?.["errors"] as string[]) ?? []
					)
				: []

			if (codes.includes("BIRTH_DATE_INVALID")) {
				this.birthDateError = this.locale.birthDateInvalid
			} else if (codes.includes("PHONE_INVALID")) {
				this.phoneError = this.locale.phoneInvalid
			} else if (codes.includes("ADDRESS_INVALID")) {
				this.addressError = this.locale.addressTooLong
			} else if (codes.includes("PROFILE_DESCRIPTION_TOO_LONG")) {
				this.descriptionError = this.locale.descriptionTooLong
			} else {
				this.error = this.locale.error
			}
		}

		this.loading = false
	}
}
