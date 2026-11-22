import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { FaIconComponent } from "@fortawesome/angular-fontawesome"
import {
	faCamera,
	faHeart,
	faPalette,
	faStar,
	faTruckFast
} from "@fortawesome/free-solid-svg-icons"
import { Dav } from "dav-js"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { RoutingService } from "src/app/services/routing-service"
import { formatPrice } from "src/app/misc/utils"
import { Toy } from "src/app/misc/types"
import { drawingPrice } from "src/constants/constants"
import { environment } from "src/environments/environment"
import { LocalizationService } from "src/app/services/localization-service"

/** Landing page for turning the drawing of a child into a real toy */
@Component({
	templateUrl: "./drawing-page.component.html",
	styleUrl: "./drawing-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [FaIconComponent, ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DrawingPageComponent {
	locale = this.localizationService.locale.drawingPage
	faCamera = faCamera
	faPalette = faPalette
	faTruckFast = faTruckFast
	faHeart = faHeart
	faStar = faStar
	// The products made from drawings that can be bought directly
	products: Toy[] = []

	examples = [
		{
			src: "/assets/images/drawings/portrait.jpg",
			alt: this.locale.example1Alt,
			color: "red"
		},
		{
			src: "/assets/images/drawings/sloths.jpg",
			alt: this.locale.example2Alt,
			color: "blue"
		},
		{
			src: "/assets/images/drawings/figure.jpg",
			alt: this.locale.example3Alt,
			color: "green"
		}
	]

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		try {
			this.products = await this.apiService.listDrawingToys()
		} catch (error) {
			console.error(error)
		}
	}

	/** Uploading needs a login, so the login page is shown first */
	async upload() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			this.navigateToDrawingsPage()
		} else {
			Dav.ShowLoginPage(environment.apiKey, window.location.origin + "/drawings")
		}
	}

	get priceText(): string {
		return this.locale.priceInfo.replace(
			"{0}",
			formatPrice(drawingPrice, this.localizationService.language)
		)
	}

	navigateToDrawingsPage() {
		this.routingService.navigateToDrawingsPage()
	}
}
