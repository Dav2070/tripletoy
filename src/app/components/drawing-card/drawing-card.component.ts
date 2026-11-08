import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	EventEmitter,
	Input,
	Output
} from "@angular/core"
import { Drawing } from "src/app/misc/types"
import { getDrawingUrl } from "src/app/misc/utils"
import { LocalizationService } from "src/app/services/localization-service"

/** A drawing of the user with its image, status and upload date */
@Component({
	selector: "app-drawing-card",
	templateUrl: "./drawing-card.component.html",
	styleUrl: "./drawing-card.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DrawingCardComponent {
	@Input() drawing: Drawing
	/** Shows the button to pay the drawing if it has not been paid yet */
	@Input() payable: boolean = false
	@Input() paying: boolean = false
	@Output() pay = new EventEmitter<Drawing>()
	locale = this.localizationService.locale.drawingsPage

	constructor(private localizationService: LocalizationService) {}

	get url(): string {
		return getDrawingUrl(this.drawing)
	}

	get dateText(): string {
		const date = new Date(this.drawing.createdAt).toLocaleDateString(
			this.localizationService.language
		)

		return this.locale.uploadedOn.replace("{0}", date)
	}
}
