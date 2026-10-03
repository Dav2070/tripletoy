import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { Dav } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { environment } from "src/environments/environment"

@Component({
	templateUrl: "./user-page.component.html",
	styleUrl: "./user-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPageComponent {
	locale = this.localizationService.locale.userPage

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()
	}

	showLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.origin)
	}

	showSignupPage() {
		Dav.ShowSignupPage(environment.apiKey, window.location.origin)
	}

	logout() {
		this.dataService.dav.Logout().then(() => (window.location.href = "/user"))
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
