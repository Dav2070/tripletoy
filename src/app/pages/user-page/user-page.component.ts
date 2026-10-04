import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { Dav } from "dav-js"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { ApiService } from "src/app/services/api-service"
import { Toy } from "src/app/misc/types"
import {
	profileAgeMax,
	profileAgeMin,
	toysPageSize
} from "src/constants/constants"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { environment } from "src/environments/environment"

@Component({
	templateUrl: "./user-page.component.html",
	styleUrl: "./user-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPageComponent {
	locale = this.localizationService.locale.userPage
	toys: Toy[] = []
	total: number = 0
	loadingToys: boolean = false
	toysLoaded: boolean = false
	purchases: Toy[] = []
	purchasesTotal: number = 0
	loadingPurchases: boolean = false
	age: string = ""
	ageError: string = ""
	profileDescription: string = ""
	profileDescriptionError: string = ""
	profileError: string = ""
	profileSaved: boolean = false
	savingProfile: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await Promise.all([
				this.loadProfile(),
				this.loadToys(),
				this.loadPurchases()
			])
		}
	}

	async loadPurchases() {
		this.loadingPurchases = true

		try {
			const list = await this.apiService.listMyPurchases(
				toysPageSize,
				this.purchases.length
			)

			this.purchases = this.purchases.concat(list.items)
			this.purchasesTotal = list.total
		} catch (error) {
			console.error(error)
		}

		this.loadingPurchases = false
	}

	async loadProfile() {
		try {
			const profile = await this.apiService.retrieveMyProfile()

			this.age = profile.age?.toString() ?? ""
			this.profileDescription = profile.description ?? ""
		} catch (error) {
			console.error(error)
		}
	}

	ageChange(event: Event) {
		this.age = (event as CustomEvent).detail.value
		this.ageError = ""
		this.profileSaved = false
	}

	profileDescriptionChange(event: Event) {
		this.profileDescription = (event as CustomEvent).detail.value
		this.profileDescriptionError = ""
		this.profileSaved = false
	}

	async saveProfile() {
		this.profileError = ""
		this.profileSaved = false

		const ageText = this.age.trim()
		const age = ageText == "" ? null : Number(ageText)

		this.ageError =
			age != null &&
			(!Number.isInteger(age) || age < profileAgeMin || age > profileAgeMax)
				? this.locale.ageInvalid
				: ""
		if (this.ageError) return

		this.savingProfile = true

		try {
			await this.apiService.updateMyProfile({
				age,
				description: this.profileDescription.trim() || null
			})

			this.profileSaved = true
		} catch (error) {
			console.error(error)

			const codes: string[] = CombinedGraphQLErrors.is(error)
				? error.errors.flatMap(
						e => (e.extensions?.["errors"] as string[]) ?? []
					)
				: []

			if (codes.includes("AGE_INVALID")) {
				this.ageError = this.locale.ageInvalid
			} else if (codes.includes("PROFILE_DESCRIPTION_TOO_LONG")) {
				this.profileDescriptionError = this.locale.descriptionTooLong
			} else {
				this.profileError = this.locale.profileError
			}
		}

		this.savingProfile = false
	}

	async loadToys() {
		this.loadingToys = true

		try {
			const list = await this.apiService.listMyToys(
				toysPageSize,
				this.toys.length
			)

			this.toys = this.toys.concat(list.items)
			this.total = list.total
			this.toysLoaded = true
		} catch (error) {
			console.error(error)
		}

		this.loadingToys = false
	}

	showLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.origin)
	}

	showSignupPage() {
		Dav.ShowSignupPage(environment.apiKey, window.location.origin)
	}

	logout() {
		this.dataService.dav.Logout().then(() => (window.location.href = "/user"))
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
