import {
	AfterViewInit,
	Component,
	ElementRef,
	Input,
	OnChanges,
	OnDestroy,
	SimpleChanges,
	ViewChild,
	ViewEncapsulation,
	ChangeDetectionStrategy
} from "@angular/core"
import { Router } from "@angular/router"
import * as L from "leaflet"
import { ToyLocation } from "src/app/misc/types"
import { formatPrice, getToyPhotoUrl } from "src/app/misc/utils"
import { LocalizationService } from "src/app/services/localization-service"
import { defaultToyImageUrl } from "src/constants/constants"

const pinColors = [
	"var(--toy-blue)",
	"var(--toy-red)",
	"var(--toy-green)",
	"var(--toy-purple)"
]

/** Map with the approximate positions of the toys, one marker per position */
@Component({
	selector: "app-toy-map",
	template: `<div #map class="toy-map"></div>`,
	styleUrl: "./toy-map.component.scss",
	// The markers and popups are created by Leaflet, so the styles must be global
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.Eager
})
export class ToyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
	@Input() locations: ToyLocation[] = []
	@ViewChild("map") mapElement: ElementRef<HTMLDivElement>

	private map: L.Map = null
	private markers = L.layerGroup()
	locale = this.localizationService.locale.startPage

	constructor(
		private router: Router,
		private localizationService: LocalizationService
	) {}

	ngAfterViewInit() {
		this.map = L.map(this.mapElement.nativeElement, {
			// Zooming with the mouse wheel would block scrolling the page
			scrollWheelZoom: false,
			maxZoom: 14,
			minZoom: 3
		})

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 14,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(this.map)

		this.markers.addTo(this.map)
		this.showLocations()
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes["locations"] && this.map != null) this.showLocations()
	}

	ngOnDestroy() {
		this.map?.remove()
	}

	private showLocations() {
		this.markers.clearLayers()
		if (this.locations.length == 0) return

		// Toys with the same position share one marker
		const groups = new Map<string, ToyLocation[]>()

		for (const location of this.locations) {
			const key = `${location.latitude},${location.longitude}`
			groups.set(key, [...(groups.get(key) ?? []), location])
		}

		const bounds = L.latLngBounds([])
		let index = 0

		for (const toys of groups.values()) {
			const position = L.latLng(toys[0].latitude, toys[0].longitude)
			bounds.extend(position)

			L.marker(position, { icon: this.createIcon(toys.length, index++) })
				.bindPopup(this.createPopup(toys), { minWidth: 200 })
				.addTo(this.markers)
		}

		if (groups.size == 1) {
			this.map.setView(bounds.getCenter(), 11)
		} else {
			this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
		}
	}

	private createIcon(count: number, index: number): L.DivIcon {
		const pin = document.createElement("div")
		pin.className = "toy-pin"
		pin.style.setProperty("--pin", pinColors[index % pinColors.length])
		pin.textContent = count > 1 ? count.toString() : ""

		return L.divIcon({
			html: pin,
			className: "toy-pin-container",
			iconSize: [36, 36],
			iconAnchor: [18, 18],
			popupAnchor: [0, -18]
		})
	}

	/** The popup is built with textContent, the titles are entered by the users */
	private createPopup(toys: ToyLocation[]): HTMLElement {
		const language = this.localizationService.language
		const popup = document.createElement("div")
		popup.className = "toy-popup"

		if (toys.length > 1) {
			const heading = document.createElement("p")
			heading.className = "toy-popup-heading"
			heading.textContent = this.locale.mapToys.replace(
				"{0}",
				toys.length.toString()
			)
			popup.appendChild(heading)
		}

		for (const toy of toys.slice(0, 5)) {
			const link = document.createElement("a")
			link.className = "toy-popup-item"
			link.href = `/toy/${encodeURIComponent(toy.uuid)}`
			link.addEventListener("click", event => {
				event.preventDefault()
				this.router.navigate(["toy", toy.uuid])
			})

			const image = document.createElement("img")
			image.src = toy.photo ? getToyPhotoUrl(toy.photo) : defaultToyImageUrl
			image.alt = ""

			const text = document.createElement("span")
			const title = document.createElement("strong")
			title.textContent = toy.title
			const price = document.createElement("span")
			price.textContent = formatPrice(toy.price, language)

			text.append(title, price)
			link.append(image, text)
			popup.appendChild(link)
		}

		if (toys.length > 5) {
			const more = document.createElement("p")
			more.className = "toy-popup-more"
			more.textContent = `+ ${toys.length - 5}`
			popup.appendChild(more)
		}

		return popup
	}
}
