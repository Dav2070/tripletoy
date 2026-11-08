import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { RoutingService } from "src/app/services/routing-service"
import { KidsEvent } from "src/app/misc/types"
import { fromDateTimeLocal, toDateTimeLocal } from "src/app/misc/utils"

interface EventForm {
	title: string
	description: string
	venue: string
	line1: string
	postalCode: string
	city: string
	country: string
	startsAt: string
	endsAt: string
	url: string
}

const emptyForm = (): EventForm => ({
	title: "",
	description: "",
	venue: "",
	line1: "",
	postalCode: "",
	city: "",
	country: "Deutschland",
	startsAt: "",
	endsAt: "",
	url: ""
})

/** The page where admins add and manage the events */
@Component({
	templateUrl: "./events-manage-page.component.html",
	styleUrl: "./events-manage-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EventsManagePageComponent implements OnInit {
	locale = this.localizationService.locale.eventsManagePage
	userLocale = this.localizationService.locale.userPage
	isAdmin = false
	loading = true
	saving = false
	events: KidsEvent[] = []
	form: EventForm = emptyForm()
	// Set when an existing event is edited
	editUuid: string = null
	confirmDeleteUuid: string = null
	errors: Partial<Record<keyof EventForm | "general", string>> = {}
	private language = this.localizationService.language

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private routingService: RoutingService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			try {
				this.isAdmin = (await this.apiService.retrieveMyProfile()).isAdmin
				if (this.isAdmin) await this.loadEvents()
			} catch (error) {
				console.error(error)
			}
		}

		this.loading = false
	}

	private async loadEvents() {
		this.events = await this.apiService.listAllEvents()
	}

	isPast(event: KidsEvent): boolean {
		// Events without an end are over a few hours after the start, as in the API
		const end = event.endsAt
			? new Date(event.endsAt).getTime()
			: new Date(event.startsAt).getTime() + 3 * 60 * 60 * 1000

		return end < Date.now()
	}

	date(event: KidsEvent): string {
		return new Date(event.startsAt).toLocaleString(this.language, {
			dateStyle: "medium",
			timeStyle: "short"
		})
	}

	change(field: keyof EventForm, event: Event) {
		this.form[field] =
			(event as CustomEvent).detail?.value ??
			(event.target as HTMLInputElement).value
		delete this.errors[field]
		delete this.errors.general
	}

	edit(event: KidsEvent) {
		this.editUuid = event.uuid
		this.confirmDeleteUuid = null
		this.errors = {}
		this.form = {
			title: event.title,
			description: event.description ?? "",
			venue: event.venue ?? "",
			line1: event.line1,
			postalCode: event.postalCode,
			city: event.city,
			country: event.country,
			startsAt: toDateTimeLocal(event.startsAt),
			endsAt: toDateTimeLocal(event.endsAt),
			url: event.url ?? ""
		}

		window.scrollTo({ top: 0, behavior: "smooth" })
	}

	resetForm() {
		this.editUuid = null
		this.errors = {}
		this.form = emptyForm()
	}

	async delete(event: KidsEvent) {
		try {
			await this.apiService.deleteEvent(event.uuid)
			this.confirmDeleteUuid = null

			if (this.editUuid == event.uuid) this.resetForm()
			await this.loadEvents()
		} catch (error) {
			console.error(error)
			this.errors = { general: this.locale.error }
		}
	}

	private handleError(error: unknown) {
		const codes: string[] = CombinedGraphQLErrors.is(error)
			? error.errors.flatMap(e => (e.extensions?.["errors"] as string[]) ?? [])
			: []

		this.errors = {}

		if (codes.some(c => c.startsWith("TITLE_")))
			this.errors.title = this.locale.titleRequired
		if (codes.includes("EVENT_START_INVALID"))
			this.errors.startsAt = this.locale.startRequired
		if (codes.includes("EVENT_END_INVALID"))
			this.errors.endsAt = this.locale.endInvalid
		if (codes.includes("EVENT_URL_INVALID"))
			this.errors.url = this.locale.urlInvalid
		if (codes.includes("DESCRIPTION_TOO_LONG"))
			this.errors.description = this.locale.descriptionTooLong
		if (codes.includes("ADDRESS_REQUIRED") || codes.includes("ADDRESS_INVALID"))
			this.errors.line1 = this.locale.addressRequired
		if (codes.includes("EVENT_LOCATION_NOT_FOUND"))
			this.errors.postalCode = this.locale.locationNotFound

		if (Object.keys(this.errors).length == 0)
			this.errors.general = this.locale.error
	}

	async submit() {
		const form = this.form
		const startsAt = fromDateTimeLocal(form.startsAt)
		const endsAt = fromDateTimeLocal(form.endsAt)

		this.errors = {}

		if (form.title.trim().length == 0) this.errors.title = this.locale.titleRequired
		if (startsAt == null) this.errors.startsAt = this.locale.startRequired
		if (form.endsAt.trim() != "" && (endsAt == null || (startsAt != null && endsAt < startsAt)))
			this.errors.endsAt = this.locale.endInvalid
		if (
			[form.line1, form.postalCode, form.city, form.country].some(
				v => v.trim().length == 0
			)
		)
			this.errors.line1 = this.locale.addressRequired

		if (Object.keys(this.errors).length > 0) return

		const input = {
			title: form.title.trim(),
			description: form.description.trim() || null,
			startsAt,
			endsAt,
			venue: form.venue.trim() || null,
			line1: form.line1.trim(),
			postalCode: form.postalCode.trim(),
			city: form.city.trim(),
			country: form.country.trim(),
			url: form.url.trim() || null
		}

		this.saving = true

		try {
			const saved = this.editUuid
				? await this.apiService.updateEvent(this.editUuid, input)
				: await this.apiService.createEvent(input)

			if (saved == null) throw new Error("No event returned")

			this.resetForm()
			await this.loadEvents()
		} catch (error) {
			console.error(error)
			this.handleError(error)
		}

		this.saving = false
	}

	navigateToUserPage() {
		this.routingService.navigateToUserPage()
	}
}
