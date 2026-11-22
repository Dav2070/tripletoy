import { Injectable } from "@angular/core"
import { Router } from "@angular/router"
import { ToyCategory } from "src/app/misc/types"

@Injectable({ providedIn: "root" })
export class RoutingService {
	constructor(private router: Router) {}

	navigateToStartPage() {
		this.router.navigate(["/"])
	}

	navigateToToysPage() {
		this.router.navigate(["toys"])
	}

	navigateToJewelryPage() {
		this.router.navigate(["jewelry"])
	}

	navigateToEventsPage() {
		this.router.navigate(["events"])
	}

	navigateToManageEventsPage() {
		this.router.navigate(["user", "events"])
	}

	navigateToDrawingPage() {
		this.router.navigate(["drawing"])
	}

	navigateToDrawingsPage() {
		this.router.navigate(["drawings"])
	}

	navigateToUserPage() {
		this.router.navigate(["user"])
	}

	navigateToEditProfilePage() {
		this.router.navigate(["user", "edit"])
	}

	/** The category is preselected for admins */
	navigateToNewToyPage(category?: ToyCategory) {
		this.router.navigate(["toy", "new"], {
			queryParams: category != null ? { category } : {}
		})
	}

	navigateToEditToyPage(uuid: string) {
		this.router.navigate(["toy", uuid, "edit"])
	}

	navigateToToyPage(uuid: string) {
		this.router.navigate(["toy", uuid])
	}

	navigateToChatsPage() {
		this.router.navigate(["chats"])
	}

	navigateToChatPage(uuid: string) {
		this.router.navigate(["chats", uuid])
	}
}
