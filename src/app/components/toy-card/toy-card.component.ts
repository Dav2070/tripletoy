import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Input,
	ChangeDetectionStrategy
} from "@angular/core"
import { RouterLink } from "@angular/router"
import { Toy } from "src/app/misc/types"
import { formatPrice, getToyPhotoUrl } from "src/app/misc/utils"
import { LocalizationService } from "src/app/services/localization-service"
import { defaultToyImageUrl } from "src/constants/constants"

@Component({
	selector: "app-toy-card",
	templateUrl: "./toy-card.component.html",
	styleUrl: "./toy-card.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToyCardComponent {
	@Input() toy: Toy
	/** Shows the card as a toy the user has bought */
	@Input() purchased: boolean = false
	locale = this.localizationService.locale.toyPage

	constructor(private localizationService: LocalizationService) {}

	get imageUrl(): string {
		return this.toy.photos?.length > 0
			? getToyPhotoUrl(this.toy.photos[0])
			: defaultToyImageUrl
	}

	get price(): string {
		// Toys are listed without a price
		return this.toy.price > 0
			? formatPrice(this.toy.price, this.localizationService.language)
			: ""
	}
}
