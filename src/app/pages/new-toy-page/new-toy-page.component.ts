import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { parsePriceToCents } from "src/app/misc/utils"

@Component({
	templateUrl: "./new-toy-page.component.html",
	styleUrl: "./new-toy-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewToyPageComponent {
	locale = this.localizationService.locale.newToyPage
	userLocale = this.localizationService.locale.userPage
	title: string = ""
	titleError: string = ""
	description: string = ""
	price: string = ""
	priceError: string = ""
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

		if (codes.includes("PRICE_INVALID")) {
			this.priceError = this.locale.priceInvalid
		}

		if (codes.includes("DESCRIPTION_TOO_LONG")) {
			this.error = this.locale.descriptionTooLong
		} else if (codes.length == 0) {
			this.error = this.locale.error
		}
	}

	async submit() {
		this.error = ""

		const title = this.title.trim()
		const price = parsePriceToCents(this.price)

		this.titleError = title.length == 0 ? this.locale.titleRequired : ""
		this.priceError = price == null ? this.locale.priceInvalid : ""
		if (this.titleError || this.priceError) return

		this.loading = true

		try {
			const toy = await this.apiService.createToy({
				title,
				description: this.description.trim() || undefined,
				price
			})

			if (toy == null) throw new Error("No toy returned")
			this.routingService.navigateToToyPage(toy.uuid)
		} catch (error) {
			console.error(error)
			this.handleError(error)
		}

		this.loading = false
	}
}
