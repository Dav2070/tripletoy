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
	faClock,
	faHeart,
	faLocationDot,
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
import { Position, Toy, ToyLocation } from "src/app/misc/types"
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
	// The position of the user, set when the toys are sorted by distance
	position: Position = null
	locating: boolean = false
	locationError: boolean = false
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
	faClock = faClock
	faLocationDot = faLocationDot
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
				0,
				this.position ?? undefined
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
				this.toys.length,
				this.position ?? undefined
			)

			this.toys = this.toys.concat(list.items)
			this.total = list.total
		} catch (error) {
			console.error(error)
		}

		this.loading = false
	}

	/** Sorts the toys by the newest or by the distance to the current location of the user */
	async sortBy(distance: boolean) {
		this.locationError = false

		if (distance == (this.position != null) || this.locating) return

		if (distance) {
			this.locating = true

			try {
				this.position = await this.getCurrentPosition()
			} catch (error) {
				console.error(error)
				this.locationError = true
				this.locating = false
				return
			}

			this.locating = false
		} else {
			this.position = null
		}

		this.toys = []
		this.total = 0
		await this.loadToys()
	}

	/** The position is rounded to about one kilometer, that is enough for the approximate positions */
	private getCurrentPosition(): Promise<Position> {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation is not supported"))
				return
			}

			navigator.geolocation.getCurrentPosition(
				result =>
					resolve({
						latitude: Math.round(result.coords.latitude * 100) / 100,
						longitude: Math.round(result.coords.longitude * 100) / 100
					}),
				error => reject(error),
				{ timeout: 10000, maximumAge: 5 * 60 * 1000 }
			)
		})
	}

	scrollToToys() {
		this.toysSection?.nativeElement.scrollIntoView({ behavior: "smooth" })
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
