import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	HostListener,
	ChangeDetectionStrategy
} from "@angular/core"
import { Router, RouterLink, RouterOutlet, NavigationEnd } from "@angular/router"
import { FaIconComponent } from "@fortawesome/angular-fontawesome"
import { faCircleUser as faCircleUserRegular } from "@fortawesome/free-regular-svg-icons"
import {
	faCircleUser as faCircleUserSolid,
	faPuzzlePiece
} from "@fortawesome/free-solid-svg-icons"
import { Dav, Environment } from "dav-js"
import * as DavUIComponents from "dav-ui-components"
import { DataService } from "./services/data-service"
import { LocalizationService } from "./services/localization-service"
import { RoutingService } from "./services/routing-service"
import { smallWindowMaxSize } from "src/constants/constants"
import { environment } from "src/environments/environment"

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink, RouterOutlet, FaIconComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
	locale = this.localizationService.locale.misc
	appNameLetters = this.locale.appName.split("")
	faCircleUserRegular = faCircleUserRegular
	faCircleUserSolid = faCircleUserSolid
	faPuzzlePiece = faPuzzlePiece
	startTabActive: boolean = false
	userButtonSelected: boolean = false

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService,
		private routingService: RoutingService,
		private router: Router
	) {
		DavUIComponents.setLocale(this.localizationService.language)

		this.router.events.forEach(event => {
			if (event instanceof NavigationEnd) {
				const url = event.urlAfterRedirects.split("?")[0]

				// The toy pages belong to the toys tab
				this.startTabActive = url == "/" || url.startsWith("/toy/")
				this.userButtonSelected = url == "/user"
			}
		})
	}

	async ngOnInit() {
		this.setSize()
		this.dataService.applyTheme()

		new Dav({
			environment: environment.environment,
			appId: environment.appId,
			tableNames: [],
			callbacks: {
				UserLoaded: () => this.dataService.userPromiseHolder.Resolve()
			}
		})

		// Log the user in if there is an access token in the url
		const url = new URL(window.location.href)
		const accessToken = url.searchParams.get("accessToken")

		if (accessToken != null) {
			await Dav.Login(accessToken)

			// Reload the page without the access token in the url
			url.searchParams.delete("accessToken")
			window.location.href = url.toString()
		}
	}

	@HostListener("window:resize")
	setSize() {
		this.dataService.isMobile = window.innerWidth <= smallWindowMaxSize
	}

	navigateToStartPage() {
		this.routingService.navigateToStartPage()
	}

	navigateToUserPage() {
		this.routingService.navigateToUserPage()
	}
}
