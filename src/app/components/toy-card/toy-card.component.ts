import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Input,
	ChangeDetectionStrategy
} from "@angular/core"
import { RouterLink } from "@angular/router"
import { Toy } from "src/app/misc/types"
import { formatPrice } from "src/app/misc/utils"
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
	imageUrl = defaultToyImageUrl

	constructor(private localizationService: LocalizationService) {}

	get price(): string {
		return formatPrice(this.toy.price, this.localizationService.language)
	}
}
