import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import { Dav } from "dav-js"
import { DrawingCardComponent } from "src/app/components/drawing-card/drawing-card.component"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { Drawing } from "src/app/misc/types"
import {
	drawingMaxCount,
	drawingPrice,
	toyPhotoMaxBytes,
	toyPhotoTypes
} from "src/constants/constants"
import { formatPrice } from "src/app/misc/utils"
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
	paying: boolean = false
	// The drawing Stripe redirected back for after a successful payment
	private paidDrawingUuid: string = null
	paymentResult: "success" | "cancel" | null = null
	error: string = ""

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	get priceText(): string {
		return formatPrice(drawingPrice, this.localizationService.language)
	}

	get uploadText(): string {
		return this.locale.uploadAndPay.replace("{0}", this.priceText)
	}

	async ngOnInit() {
		const payment = this.activatedRoute.snapshot.queryParamMap.get("payment")
		this.paymentResult =
			payment == "success" || payment == "cancel" ? payment : null
		this.paidDrawingUuid =
			payment == "success"
				? this.activatedRoute.snapshot.queryParamMap.get("drawing")
				: null

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
			this.drawings = list.items.map(drawing =>
				// The API only knows about the payment after the webhook of dav, so the
				// drawing Stripe redirected for is shown as paid right away
				drawing.uuid == this.paidDrawingUuid &&
				drawing.status == "PENDING_PAYMENT"
					? { ...drawing, status: "RECEIVED" }
					: drawing
			)
		} catch (error) {
			console.error(error)
			this.error = this.locale.loadError
		}
	}

	/** Uploads the drawing and goes directly to the checkout */
	async fileSelected(event: Event) {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0]

		// Allow selecting the same file again
		input.value = ""

		this.error = ""
		this.paymentResult = null

		if (file == null) return

		if (this.drawings.length >= drawingMaxCount) {
			this.error = this.locale.tooMany
			return
		}

		if (!toyPhotoTypes.includes(file.type) || file.size > toyPhotoMaxBytes) {
			this.error = this.locale.invalidFile
			return
		}

		this.uploading = true

		try {
			const drawing = await this.apiService.uploadDrawing(file)
			this.drawings = [drawing, ...this.drawings]
			this.uploading = false

			await this.pay(drawing)
		} catch (error) {
			console.error(error)
			this.error = this.locale.uploadError
			this.uploading = false
		}
	}

	/** Redirects to the Stripe checkout, Stripe redirects back after the payment */
	async pay(drawing: Drawing) {
		this.error = ""
		this.paying = true

		try {
			const url = window.location.origin + "/drawings"

			window.location.href = await this.apiService.createDrawingCheckoutSession({
				uuid: drawing.uuid,
				productName: this.locale.productName,
				successUrl: `${url}?payment=success&drawing=${drawing.uuid}`,
				cancelUrl: url + "?payment=cancel"
			})
			return
		} catch (error) {
			console.error(error)
			this.error = this.locale.checkoutError
		}

		this.paying = false
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
