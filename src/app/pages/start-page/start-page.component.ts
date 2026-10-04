import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	ElementRef,
	ViewChild
} from "@angular/core"
import { FaIconComponent } from "@fortawesome/angular-fontawesome"
import {
	faCamera,
	faCartShopping,
	faHeart,
	faPiggyBank,
	faPuzzlePiece,
	faRecycle,
	faSeedling,
	faStar,
	faTruckFast
} from "@fortawesome/free-solid-svg-icons"
import { ToyMapComponent } from "src/app/components/toy-map/toy-map.component"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Toy, ToyLocation } from "src/app/misc/types"
import { toysPageSize } from "src/constants/constants"

@Component({
	templateUrl: "./start-page.component.html",
	styleUrl: "./start-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent, ToyMapComponent, FaIconComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StartPageComponent {
	locale = this.localizationService.locale.startPage
	toys: Toy[] = []
	locations: ToyLocation[] = []
	total: number = 0
	loading: boolean = true
	faCamera = faCamera
	faCartShopping = faCartShopping
	faTruckFast = faTruckFast
	faSeedling = faSeedling
	faPiggyBank = faPiggyBank
	faRecycle = faRecycle
	faHeart = faHeart
	faStar = faStar
	faPuzzlePiece = faPuzzlePiece

	@ViewChild("toysSection") toysSection: ElementRef<HTMLElement>

	constructor(
		private dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await Promise.all([this.loadToys(), this.loadLocations()])

		// The toys are loaded again with the access token to mark the toys of the user
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.reloadToys()
		}
	}

	/** Loads the toys that are shown again, without losing the pages that were loaded */
	private async reloadToys() {
		try {
			const list = await this.apiService.listToys(
				Math.max(this.toys.length, toysPageSize),
				0
			)

			this.toys = list.items
			this.total = list.total
		} catch (error) {
			console.error(error)
		}
	}

	private async loadLocations() {
		try {
			this.locations = await this.apiService.listToyLocations()
		} catch (error) {
			console.error(error)
		}
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

	scrollToToys() {
		this.toysSection?.nativeElement.scrollIntoView({ behavior: "smooth" })
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
