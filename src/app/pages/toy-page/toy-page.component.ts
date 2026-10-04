import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { ActivatedRoute, RouterLink } from "@angular/router"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { Dav } from "dav-js"
import { RoutingService } from "src/app/services/routing-service"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { Toy } from "src/app/misc/types"
import { formatPrice, getToyPhotoUrl } from "src/app/misc/utils"
import { defaultToyImageUrl } from "src/constants/constants"
import { environment } from "src/environments/environment"

@Component({
	templateUrl: "./toy-page.component.html",
	styleUrl: "./toy-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToyPageComponent {
	locale = this.localizationService.locale.toyPage
	notFoundLocale = this.localizationService.locale.notFoundPage
	selectedPhotoIndex: number = 0
	toy: Toy = null
	price: string = ""
	listedOn: string = ""
	loading: boolean = true
	purchased: boolean = false
	checkoutLoading: boolean = false
	checkoutError: string = ""
	deleteDialogVisible: boolean = false
	deleteLoading: boolean = false
	deleteError: string = ""

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	getPhotoUrl = getToyPhotoUrl

	get imageUrl(): string {
		const photo = this.toy?.photos?.[this.selectedPhotoIndex]
		return photo ? getToyPhotoUrl(photo) : defaultToyImageUrl
	}

	get buyLabel(): string {
		return this.locale.buy.replace("{0}", this.price)
	}

	async ngOnInit() {
		const params = this.activatedRoute.snapshot.queryParamMap
		this.purchased = params.get("purchase") == "success"

		await this.loadToy()
		this.loading = false

		// Load the toy again with the access token to find out if it belongs to the user
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.loadToy()

			if (params.get("redirectToCheckout") == "true") {
				await this.buy()
			}
		}
	}

	private async loadToy() {
		const uuid = this.activatedRoute.snapshot.paramMap.get("uuid")

		try {
			this.toy = await this.apiService.retrieveToy(uuid)
		} catch (error) {
			console.error(error)
		}

		if (this.toy != null) {
			const language = this.localizationService.language

			this.price = formatPrice(this.toy.price, language)
			this.listedOn = this.locale.listedOn.replace(
				"{0}",
				new Date(this.toy.createdAt).toLocaleDateString(language)
			)
		}
	}

	navigateToEditPage() {
		this.routingService.navigateToEditToyPage(this.toy.uuid)
	}

	showDeleteDialog() {
		this.deleteError = ""
		this.deleteDialogVisible = true
	}

	async deleteToy() {
		this.deleteLoading = true
		this.deleteError = ""

		try {
			await this.apiService.deleteToy(this.toy.uuid)
			this.deleteDialogVisible = false
			this.routingService.navigateToUserPage()
		} catch (error) {
			console.error(error)
			this.deleteError = this.locale.deleteError
		}

		this.deleteLoading = false
	}

	async buy() {
		if (this.toy == null || this.toy.sold || this.toy.mine) return
		this.checkoutError = ""

		if (!this.dataService.dav.isLoggedIn) {
			// Log in and come back to start the checkout
			const url = new URL(window.location.href)
			url.searchParams.delete("purchase")
			url.searchParams.set("redirectToCheckout", "true")
			Dav.ShowLoginPage(environment.apiKey, url.toString())
			return
		}

		this.checkoutLoading = true

		try {
			const toyUrl = window.location.origin + window.location.pathname

			// Stripe redirects to the success url after the payment
			window.location.href = await this.apiService.createToyCheckoutSession({
				uuid: this.toy.uuid,
				successUrl: toyUrl + "?purchase=success",
				cancelUrl: toyUrl
			})
			return
		} catch (error) {
			console.error(error)

			const codes: string[] = CombinedGraphQLErrors.is(error)
				? error.errors.map(e => e.extensions?.["code"] as string)
				: []

			if (codes.includes("TOY_ALREADY_SOLD")) {
				await this.loadToy()
			} else {
				this.checkoutError = this.locale.checkoutError
			}
		}

		this.checkoutLoading = false
	}
}
