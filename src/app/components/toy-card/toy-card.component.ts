import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Input,
	ChangeDetectionStrategy
} from "@angular/core"
import { RouterLink } from "@angular/router"
import { FaIconComponent } from "@fortawesome/angular-fontawesome"
import { faLocationDot, faUser } from "@fortawesome/free-solid-svg-icons"
import { Toy } from "src/app/misc/types"
import { formatPrice, getToyPhotoUrl } from "src/app/misc/utils"
import { LocalizationService } from "src/app/services/localization-service"
import { defaultToyImageUrl } from "src/constants/constants"

@Component({
	selector: "app-toy-card",
	templateUrl: "./toy-card.component.html",
	styleUrl: "./toy-card.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink, FaIconComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToyCardComponent {
	@Input() toy: Toy
	/** Shows the card as a toy the user has bought */
	@Input() purchased: boolean = false
	/** Shows a badge if the toy belongs to the logged in user */
	@Input() showMine: boolean = true
	faUser = faUser
	faLocationDot = faLocationDot
	locale = this.localizationService.locale.toyPage

	constructor(private localizationService: LocalizationService) {}

	get imageUrl(): string {
		return this.toy.photos?.length > 0
			? getToyPhotoUrl(this.toy.photos[0])
			: defaultToyImageUrl
	}

	get distanceText(): string {
		if (this.toy.distance == null) return ""

		return this.toy.distance < 1
			? this.locale.distanceLess
			: this.locale.distance.replace(
					"{0}",
					Math.round(this.toy.distance).toLocaleString(
						this.localizationService.language
					)
				)
	}

	get price(): string {
		// Toys are listed without a price
		return this.toy.price > 0
			? formatPrice(this.toy.price, this.localizationService.language)
			: ""
	}
}
