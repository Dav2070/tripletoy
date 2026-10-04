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
	// The user did not share the location, so the newest toys are shown
	locationUnavailable: boolean = false
	// Incremented when the list is replaced, to ignore answers of outdated requests
	private listVersion: number = 0
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
		await Promise.all([this.loadLocations(), this.loadInitialToys()])

		// The toys are loaded again with the access token to mark the toys of the user
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.reloadToys()
		}
	}

	/**
	 * The toys are sorted by the distance to the user if the location is shared,
	 * otherwise the newest toys are shown.
	 */
	private async loadInitialToys() {
		const permission = await this.getLocationPermission()

		if (permission == "granted") {
			// The browser answers right away, so the list is sorted from the start
			try {
				this.position = await this.getCurrentPosition()
			} catch (error) {
				console.error(error)
				this.locationUnavailable = true
			}

			await this.loadToys()
		} else if (permission == "denied" || !navigator.geolocation) {
			this.locationUnavailable = true
			await this.loadToys()
		} else {
			// The browser asks the user, show the newest toys until there is an answer
			await Promise.all([this.loadToys(), this.sortByLocation()])
		}
	}

	private async sortByLocation() {
		try {
			this.position = await this.getCurrentPosition()
		} catch (error) {
			console.error(error)
			this.locationUnavailable = true
			return
		}

		this.listVersion++
		this.toys = []
		this.total = 0
		await this.loadToys()
	}

	private async getLocationPermission(): Promise<PermissionState> {
		try {
			const status = await navigator.permissions.query({
				name: "geolocation"
			})

			return status.state
		} catch {
			// Not supported, the browser asks when the location is requested
			return "prompt"
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
		const version = this.listVersion
		this.loading = true

		try {
			const list = await this.apiService.listToys(
				toysPageSize,
				this.toys.length,
				this.position ?? undefined
			)

			// The list was replaced in the meantime, so this answer is outdated
			if (version != this.listVersion) return

			this.toys = this.toys.concat(list.items)
			this.total = list.total
		} catch (error) {
			console.error(error)
		}

		if (version == this.listVersion) this.loading = false
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
