import { Injectable } from "@angular/core"
import { ApiService } from "./api-service"
import { DataService } from "./data-service"

@Injectable({ providedIn: "root" })
export class ChatService {
	constructor(
		private apiService: ApiService,
		private dataService: DataService
	) {}

	/** Loads the number of chats with unread messages for the badge in the navbar */
	async refreshUnreadCount() {
		if (!this.dataService.dav.isLoggedIn) {
			this.dataService.unreadChatsCount = 0
			return
		}

		try {
			this.dataService.unreadChatsCount =
				await this.apiService.retrieveMyUnreadChatsCount()
		} catch (error) {
			console.error(error)
		}
	}
}
