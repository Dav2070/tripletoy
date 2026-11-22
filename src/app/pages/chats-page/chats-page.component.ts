import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy
} from "@angular/core"
import { RouterLink } from "@angular/router"
import { Dav, defaultProfileImageUrl } from "dav-js"
import { ApiService } from "src/app/services/api-service"
import { ChatService } from "src/app/services/chat-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { Chat } from "src/app/misc/types"
import { environment } from "src/environments/environment"

@Component({
	templateUrl: "./chats-page.component.html",
	styleUrl: "./chats-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatsPageComponent {
	locale = this.localizationService.locale.chatsPage
	chatLocale = this.localizationService.locale.chatPage
	chats: Chat[] = []
	loaded: boolean = false
	error: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private chatService: ChatService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()
		if (!this.dataService.dav.isLoggedIn) return

		try {
			this.chats = await this.apiService.listMyChats()
		} catch (error) {
			console.error(error)
			this.error = true
		}

		this.loaded = true
		await this.chatService.refreshUnreadCount()
	}

	getProfileImage(chat: Chat): string {
		return chat.partner.profileImage || defaultProfileImageUrl
	}

	getPartnerName(chat: Chat): string {
		return chat.partner.firstName || this.chatLocale.unknownUser
	}

	getPreview(chat: Chat): string {
		const message = chat.lastMessage
		if (message == null) return this.locale.noMessages

		return message.mine ? this.locale.you.replace("{0}", message.text) : message.text
	}

	/** The time for messages of today, otherwise the date */
	getTime(chat: Chat): string {
		const date = new Date(chat.lastMessage?.createdAt ?? chat.createdAt)
		const language = this.localizationService.language

		return date.toDateString() == new Date().toDateString()
			? date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" })
			: date.toLocaleDateString(language)
	}

	showLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.href)
	}
}
