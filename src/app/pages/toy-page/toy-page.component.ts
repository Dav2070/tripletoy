import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { ActivatedRoute, RouterLink } from "@angular/router"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { Toy } from "src/app/misc/types"
import { formatPrice } from "src/app/misc/utils"
import { defaultToyImageUrl } from "src/constants/constants"

@Component({
	templateUrl: "./toy-page.component.html",
	styleUrl: "./toy-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToyPageComponent {
	locale = this.localizationService.locale.toyPage
	notFoundLocale = this.localizationService.locale.notFoundPage
	imageUrl = defaultToyImageUrl
	toy: Toy = null
	price: string = ""
	listedOn: string = ""
	loading: boolean = true

	constructor(
		private activatedRoute: ActivatedRoute,
		private apiService: ApiService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		const uuid = this.activatedRoute.snapshot.paramMap.get("uuid")

		try {
			this.toy = await this.apiService.retrieveToy(uuid)
		} catch (error) {
			console.error(error)
		}

		if (this.toy != null) {
			const language = this.localizationService.language

			this.price = formatPrice(this.toy.price, language)
			this.listedOn = this.locale.listedOn.replace(
				"{0}",
				new Date(this.toy.createdAt).toLocaleDateString(language)
			)
		}

		this.loading = false
	}
}
