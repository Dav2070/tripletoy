import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core"
import { ToyCardComponent } from "src/app/components/toy-card/toy-card.component"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { Toy } from "src/app/misc/types"

/** The fixed products, they are always shown separately from the other toys */
@Component({
	selector: "app-fixed-toys",
	templateUrl: "./fixed-toys.component.html",
	styleUrl: "./fixed-toys.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FixedToysComponent implements OnInit {
	locale = this.localizationService.locale.startPage
	toys: Toy[] = []

	constructor(
		private apiService: ApiService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		try {
			this.toys = await this.apiService.listFixedToys()
		} catch (error) {
			console.error(error)
		}
	}
}
