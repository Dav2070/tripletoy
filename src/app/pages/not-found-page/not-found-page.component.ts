import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"

@Component({
	templateUrl: "./not-found-page.component.html",
	styleUrl: "./not-found-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NotFoundPageComponent {
	locale = this.localizationService.locale.notFoundPage

	constructor(
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	navigateToStartPage() {
		this.routingService.navigateToStartPage()
	}
}
