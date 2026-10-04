import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { Dav } from "dav-js"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { FaIconComponent } from "@fortawesome/angular-fontawesome"
import {
	faBagShopping,
	faBoxOpen,
	faCoins,
	faTag
} from "@fortawesome/free-solid-svg-icons"
import { ApiService } from "src/app/services/api-service"
import { Profile, Toy, ToyStats } from "src/app/misc/types"
import { toysPageSize } from "src/constants/constants"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { environment } from "src/environments/environment"

@Component({
	templateUrl: "./user-page.component.html",
	styleUrl: "./user-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent, FaIconComponent],
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
	profile: Profile = null
	stats: ToyStats = null
	faBoxOpen = faBoxOpen
	faTag = faTag
	faCoins = faCoins
	faBagShopping = faBagShopping

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
				this.loadStats(),
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

	async loadStats() {
		try {
			this.stats = await this.apiService.retrieveMyToyStats()
		} catch (error) {
			console.error(error)
		}
	}

	async loadProfile() {
		try {
			this.profile = await this.apiService.retrieveMyProfile()
		} catch (error) {
			console.error(error)
		}
	}

	get coinsText(): string {
		return this.stats?.coins == 1
			? this.locale.coinsOne
			: this.locale.coins.replace("{0}", (this.stats?.coins ?? 0).toString())
	}

	get ageText(): string {
		return this.profile?.age != null
			? this.locale.ageYears.replace("{0}", this.profile.age.toString())
			: ""
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

	navigateToEditProfilePage() {
		this.routingService.navigateToEditProfilePage()
	}
}
