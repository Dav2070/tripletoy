import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Toy } from "src/app/misc/types"
import { toysPageSize } from "src/constants/constants"

@Component({
	templateUrl: "./start-page.component.html",
	styleUrl: "./start-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StartPageComponent {
	locale = this.localizationService.locale.startPage
	toys: Toy[] = []
	total: number = 0
	loading: boolean = true

	constructor(
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.loadToys()
	}

	async loadToys() {
		this.loading = true

		try {
			const list = await this.apiService.listToys(
				toysPageSize,
				this.toys.length
			)

			this.toys = this.toys.concat(list.items)
			this.total = list.total
		} catch (error) {
			console.error(error)
		}

		this.loading = false
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
