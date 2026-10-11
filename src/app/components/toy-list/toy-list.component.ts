import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	ElementRef,
	Input,
	NgZone,
	OnDestroy,
	OnInit,
	ViewChild
} from "@angular/core"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { ApiService } from "src/app/services/api-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { LocationService } from "src/app/services/location-service"
import { RoutingService } from "src/app/services/routing-service"
import { Position, Toy } from "src/app/misc/types"
import { toysPageSize } from "src/constants/constants"

// The most columns the grid can have, used to load enough toys for the rows
const maxGridColumns = 8

/**
 * The list of the toys. They are sorted by the distance to the user if the location is
 * shared, otherwise the newest toys come first.
 */
@Component({
	selector: "app-toy-list",
	templateUrl: "./toy-list.component.html",
	styleUrl: "./toy-list.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToyListComponent implements OnInit, OnDestroy {
	/** Shows only this number of rows and links to the page with all toys */
	@Input() maxRows: number = null

	locale = this.localizationService.locale.startPage
	toys: Toy[] = []
	total: number = 0
	loading: boolean = true
	// The number of columns of the grid, it depends on the width of the window
	columns: number = 1
	// The position the list was loaded with
	private listPosition: Position = null
	// Incremented when the list is replaced, to ignore answers of outdated requests
	private listVersion: number = 0
	private resizeObserver: ResizeObserver = null

	constructor(
		public locationService: LocationService,
		private apiService: ApiService,
		private dataService: DataService,
		private localizationService: LocalizationService,
		private routingService: RoutingService,
		private ngZone: NgZone
	) {}

	// The grid only exists while there are toys, so it is observed when it appears
	@ViewChild("toysGrid") set toysGrid(element: ElementRef<HTMLElement>) {
		this.resizeObserver?.disconnect()
		this.resizeObserver = null
		if (element == null) return

		if (typeof ResizeObserver == "undefined") return

		const grid = element.nativeElement

		this.resizeObserver = new ResizeObserver(() =>
			this.ngZone.run(() => this.updateColumns(grid))
		)
		this.resizeObserver.observe(grid)

		// Before the next rendering, so the list does not jump
		Promise.resolve().then(() => this.updateColumns(grid))
	}

	/** The toys that are shown, only the first rows if the number of rows is limited */
	get visibleToys(): Toy[] {
		return this.maxRows == null
			? this.toys
			: this.toys.slice(0, this.columns * this.maxRows)
	}

	get hasMoreToys(): boolean {
		return this.maxRows == null && this.toys.length < this.total
	}

	get hasMoreRows(): boolean {
		return this.maxRows != null && this.total > this.visibleToys.length
	}

	async ngOnInit() {
		await this.loadInitialToys()

		// The toys are loaded again with the access token to mark the toys of the user
		await this.dataService.userPromiseHolder.AwaitResult()

		if (this.dataService.dav.isLoggedIn) {
			await this.reloadToys()
		}
	}

	ngOnDestroy() {
		this.resizeObserver?.disconnect()
	}

	private updateColumns(grid: HTMLElement) {
		// The browser knows how many columns fit in
		const count = getComputedStyle(grid)
			.gridTemplateColumns.split(" ")
			.filter(column => column.length > 0).length

		if (count > 0 && count != this.columns) this.columns = count
	}

	/** Sorted by distance if the location is shared, otherwise the newest toys */
	private async loadInitialToys() {
		const location = this.locationService

		if (location.position != null || location.unavailable) {
			// Already known, for example from the other page
			this.listPosition = location.position
			await this.loadToys()
			return
		}

		const permission = await location.getPermission()

		if (permission == "denied") {
			location.markUnavailable()
			await this.loadToys()
		} else if (permission == "granted") {
			// The browser answers right away, so the list is sorted from the start
			await location.determine()
			this.listPosition = location.position
			await this.loadToys()
		} else {
			// The browser asks the user, show the newest toys until there is an answer
			await Promise.all([this.loadToys(), this.sortByLocation()])
		}
	}

	private async sortByLocation() {
		await this.locationService.determine()
		if (this.locationService.position == null) return

		this.listPosition = this.locationService.position
		this.listVersion++
		this.toys = []
		this.total = 0
		await this.loadToys()
	}

	/** Loads the toys that are shown again, without losing the pages that were loaded */
	private async reloadToys() {
		try {
			const list = await this.apiService.listToys(
				Math.max(this.toys.length, this.pageSize),
				0,
				this.listPosition ?? undefined
			)

			this.toys = list.items
			this.total = list.total
		} catch (error) {
			console.error(error)
		}
	}

	/** With limited rows only as many toys as the rows can show are loaded */
	private get pageSize(): number {
		return this.maxRows == null ? toysPageSize : this.maxRows * maxGridColumns
	}

	async loadToys() {
		const version = this.listVersion
		this.loading = true

		try {
			const list = await this.apiService.listToys(
				this.pageSize,
				this.toys.length,
				this.listPosition ?? undefined
			)

			// The list was replaced in the meantime, so this answer is outdated
			if (version != this.listVersion) return

			this.toys = this.toys.concat(list.items)
			this.total = list.total
		} catch (error) {
			console.error(error)
		}

		if (version == this.listVersion) this.loading = false
	}

	navigateToToysPage() {
		this.routingService.navigateToToysPage()
	}

	navigateToNewToyPage() {
		this.routingService.navigateToNewToyPage()
	}
}
