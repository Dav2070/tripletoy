import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { Dav } from "dav-js"
import { DrawingCardComponent } from "src/app/components/drawing-card/drawing-card.component"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Drawing } from "src/app/misc/types"
import {
	drawingMaxCount,
	toyPhotoMaxBytes,
	toyPhotoTypes
} from "src/constants/constants"
import { environment } from "src/environments/environment"

/** The uploaded drawings of the user with their status */
@Component({
	templateUrl: "./drawings-page.component.html",
	styleUrl: "./drawings-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [DrawingCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DrawingsPageComponent {
	locale = this.localizationService.locale.drawingsPage
	userLocale = this.localizationService.locale.userPage
	drawings: Drawing[] = []
	fileTypes = toyPhotoTypes.join(",")
	loading: boolean = true
	uploading: boolean = false
	error: string = ""

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.loadDrawings()
		}

		this.loading = false
	}

	private async loadDrawings() {
		try {
			// The API returns at most 20 drawings per user
			const list = await this.apiService.listMyDrawings(drawingMaxCount, 0)
			this.drawings = list.items
		} catch (error) {
			console.error(error)
			this.error = this.locale.loadError
		}
	}

	async filesSelected(event: Event) {
		const input = event.target as HTMLInputElement
		const files = Array.from(input.files ?? [])

		// Allow selecting the same file again
		input.value = ""

		this.error = ""

		if (files.length == 0) return

		if (this.drawings.length + files.length > drawingMaxCount) {
			this.error = this.locale.tooMany
			return
		}

		if (
			files.some(
				file => !toyPhotoTypes.includes(file.type) || file.size > toyPhotoMaxBytes
			)
		) {
			this.error = this.locale.invalidFile
			return
		}

		this.uploading = true

		// One by one, so the drawings that are uploaded stay if a later one fails
		for (const file of files) {
			try {
				const drawing = await this.apiService.uploadDrawing(file)
				this.drawings = [drawing, ...this.drawings]
			} catch (error) {
				console.error(error)
				this.error = this.locale.uploadError
				break
			}
		}

		this.uploading = false
	}

	showLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.origin + "/drawings")
	}

	showSignupPage() {
		Dav.ShowSignupPage(environment.apiKey, window.location.origin + "/drawings")
	}

	navigateToDrawingPage() {
		this.routingService.navigateToDrawingPage()
	}
}
