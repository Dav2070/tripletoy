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

/** The page with the handmade jewelry for kids */
@Component({
	templateUrl: "./jewelry-page.component.html",
	styleUrl: "./jewelry-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class JewelryPageComponent implements OnInit {
	locale = this.localizationService.locale.jewelryPage
	jewelry: Toy[] = []
	loading = true

	constructor(
		private apiService: ApiService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		try {
			this.jewelry = await this.apiService.listJewelry()
		} catch (error) {
			console.error(error)
		}

		this.loading = false
	}
}
