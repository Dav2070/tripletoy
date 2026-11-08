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
import { DataService } from "src/app/services/data-service"
import { RoutingService } from "src/app/services/routing-service"
import { environment } from "src/environments/environment"
import { LocalizationService } from "src/app/services/localization-service"

/** Landing page for turning the drawing of a child into a real toy */
@Component({
	templateUrl: "./drawing-page.component.html",
	styleUrl: "./drawing-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [FaIconComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DrawingPageComponent {
	locale = this.localizationService.locale.drawingPage
	faCamera = faCamera
	faPalette = faPalette
	faTruckFast = faTruckFast
	faHeart = faHeart
	faStar = faStar

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
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	/** Uploading needs a login, so the login page is shown first */
	async upload() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			this.navigateToDrawingsPage()
		} else {
			Dav.ShowLoginPage(environment.apiKey, window.location.origin + "/drawings")
		}
	}

	navigateToDrawingsPage() {
		this.routingService.navigateToDrawingsPage()
	}
}
