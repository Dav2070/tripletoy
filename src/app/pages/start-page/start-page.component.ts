import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	ElementRef,
	ViewChild
} from "@angular/core"
import { ToyMapComponent } from "src/app/components/toy-map/toy-map.component"
import { FixedToysComponent } from "src/app/components/fixed-toys/fixed-toys.component"
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
	imports: [FixedToysComponent, ToyListComponent, ToyMapComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StartPageComponent {
	locale = this.localizationService.locale.startPage
	locations: ToyLocation[] = []

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
