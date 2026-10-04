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
import { ToyListComponent } from "src/app/components/toy-list/toy-list.component"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { LocationService } from "src/app/services/location-service"
import { RoutingService } from "src/app/services/routing-service"
import { ToyLocation } from "src/app/misc/types"

@Component({
	templateUrl: "./start-page.component.html",
	styleUrl: "./start-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyListComponent, ToyMapComponent, FaIconComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StartPageComponent {
	locale = this.localizationService.locale.startPage
	locations: ToyLocation[] = []
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
		public locationService: LocationService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.loadLocations()
	}

	private async loadLocations() {
		try {
			this.locations = await this.apiService.listToyLocations()
		} catch (error) {
			console.error(error)
		}
	}

	scrollToToys() {
		this.toysSection?.nativeElement.scrollIntoView({ behavior: "smooth" })
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
