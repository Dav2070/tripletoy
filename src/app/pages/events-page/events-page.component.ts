import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { LocationService } from "src/app/services/location-service"
import { KidsEvent } from "src/app/misc/types"
import { eventRadius } from "src/constants/constants"

/** The page with the upcoming events for kids in the area of the user */
@Component({
	templateUrl: "./events-page.component.html",
	styleUrl: "./events-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EventsPageComponent implements OnInit {
	locale = this.localizationService.locale.eventsPage
	events: KidsEvent[] = []
	loading = true
	radius = eventRadius
	private language = this.localizationService.language

	constructor(
		public locationService: LocationService,
		private apiService: ApiService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		const location = this.locationService

		if (location.position == null && !location.unavailable) {
			const permission = await location.getPermission()

			if (permission == "denied") {
				location.markUnavailable()
			} else {
				// The browser asks the user if it has to
				await location.determine()
			}
		}

		if (location.position != null) {
			try {
				this.events = await this.apiService.listEvents(
					location.position,
					this.radius
				)
			} catch (error) {
				console.error(error)
			}
		}

		this.loading = false
	}

	get info(): string {
		return this.locale.info.replace("{0}", this.radius.toString())
	}

	get noEventsText(): string {
		return this.locale.noEvents.replace("{0}", this.radius.toString())
	}

	day(event: KidsEvent): string {
		return new Date(event.startsAt).toLocaleDateString(this.language, {
			day: "numeric"
		})
	}

	month(event: KidsEvent): string {
		return new Date(event.startsAt).toLocaleDateString(this.language, {
			month: "short"
		})
	}

	/** For example "Saturday, 7:00 PM - 9:00 PM" */
	time(event: KidsEvent): string {
		const start = new Date(event.startsAt)
		const weekday = start.toLocaleDateString(this.language, {
			weekday: "long"
		})
		const time = (date: Date) =>
			date.toLocaleTimeString(this.language, {
				hour: "2-digit",
				minute: "2-digit"
			})

		if (event.endsAt == null) return `${weekday}, ${time(start)}`

		const end = new Date(event.endsAt)

		// An event that ends on another day shows the date of the end
		return start.toDateString() == end.toDateString()
			? `${weekday}, ${time(start)} – ${time(end)}`
			: `${weekday}, ${time(start)} ${this.locale.until.replace(
					"{0}",
					end.toLocaleDateString(this.language, {
						day: "numeric",
						month: "short"
					})
				)}`
	}

	place(event: KidsEvent): string {
		return [event.venue, `${event.line1}, ${event.postalCode} ${event.city}`]
			.filter(part => !!part)
			.join(" · ")
	}

	distance(event: KidsEvent): string {
		return this.locale.distance.replace(
			"{0}",
			(event.distance ?? 0).toLocaleString(this.language)
		)
	}
}
