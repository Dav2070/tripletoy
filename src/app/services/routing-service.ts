import { Injectable } from "@angular/core"
import { Router } from "@angular/router"

@Injectable({ providedIn: "root" })
export class RoutingService {
	constructor(private router: Router) {}

	navigateToStartPage() {
		this.router.navigate(["/"])
	}

	navigateToUserPage() {
		this.router.navigate(["user"])
	}

	navigateToNewToyPage() {
		this.router.navigate(["toy", "new"])
	}

	navigateToToyPage(uuid: string) {
		this.router.navigate(["toy", uuid])
	}
}
