import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { ToyListComponent } from "src/app/components/toy-list/toy-list.component"
import { LocalizationService } from "src/app/services/localization-service"

/** The page with all toys */
@Component({
	templateUrl: "./toys-page.component.html",
	styleUrl: "./toys-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [ToyListComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ToysPageComponent {
	locale = this.localizationService.locale.toysPage

	constructor(private localizationService: LocalizationService) {}
}
