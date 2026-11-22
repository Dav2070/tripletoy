import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	ElementRef,
	ViewChild
} from "@angular/core"
import { ActivatedRoute, RouterLink } from "@angular/router"
import { Dav, defaultProfileImageUrl } from "dav-js"
import { ApiService } from "src/app/services/api-service"
import { ChatService } from "src/app/services/chat-service"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { Chat, ChatMessage, Toy } from "src/app/misc/types"
import { formatPrice, getToyPhotoUrl } from "src/app/misc/utils"
import { defaultToyImageUrl } from "src/constants/constants"
import { environment } from "src/environments/environment"

// How often the chat is checked for new messages while it is open
const pollInterval = 5000
const messageMaxLength = 2000

interface MessageGroup {
	/** The day of the messages, e.g. "Today" */
	day: string
	messages: ChatMessage[]
}

@Component({
	templateUrl: "./chat-page.component.html",
	styleUrl: "./chat-page.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	imports: [RouterLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatPageComponent {
	@ViewChild("messagesContainer") messagesContainer: ElementRef<HTMLDivElement>
	locale = this.localizationService.locale.chatPage
	chatsLocale = this.localizationService.locale.chatsPage
	messageMaxLength = messageMaxLength
	chat: Chat = null
	messages: ChatMessage[] = []
	messageGroups: MessageGroup[] = []
	hasMore: boolean = false
	loaded: boolean = false
	loadingOlder: boolean = false
	text: string = ""
	sending: boolean = false
	sendError: boolean = false
	private pollTimer: ReturnType<typeof setInterval> = null
	private polling: boolean = false
	private destroyed: boolean = false

	constructor(
		public dataService: DataService,
		private activatedRoute: ActivatedRoute,
		private apiService: ApiService,
		private chatService: ChatService,
		private localizationService: LocalizationService
	) {}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()
		if (!this.dataService.dav.isLoggedIn || this.destroyed) return

		const uuid = this.activatedRoute.snapshot.paramMap.get("uuid")

		try {
			const [chat, list] = await Promise.all([
				this.apiService.retrieveChat(uuid),
				this.apiService.listChatMessages({ chatUuid: uuid })
			])

			this.chat = chat
			this.setMessages(list.items)
			this.hasMore = list.hasMore
		} catch (error) {
			// The API returns an error for chats of other users
			console.error(error)
		}

		this.loaded = true
		if (this.chat == null || this.destroyed) return

		this.scrollToBottom()
		await this.markAsRead()
		this.pollTimer = setInterval(() => this.poll(), pollInterval)
	}

	ngOnDestroy() {
		this.destroyed = true
		if (this.pollTimer != null) clearInterval(this.pollTimer)
	}

	get partnerName(): string {
		return this.chat?.partner.firstName || this.locale.unknownUser
	}

	get partnerImage(): string {
		return this.chat?.partner.profileImage || defaultProfileImageUrl
	}

	getToyImage(toy: Toy): string {
		return toy.photos.length > 0 ? getToyPhotoUrl(toy.photos[0]) : defaultToyImageUrl
	}

	getToyPrice(toy: Toy): string {
		return formatPrice(toy.price, this.localizationService.language)
	}

	getTime(message: ChatMessage): string {
		return new Date(message.createdAt).toLocaleTimeString(
			this.localizationService.language,
			{ hour: "2-digit", minute: "2-digit" }
		)
	}

	async loadOlder() {
		if (this.messages.length == 0 || this.loadingOlder) return
		this.loadingOlder = true

		try {
			const list = await this.apiService.listChatMessages({
				chatUuid: this.chat.uuid,
				before: this.messages[0].uuid
			})

			this.setMessages(list.items.concat(this.messages))
			this.hasMore = list.hasMore
		} catch (error) {
			console.error(error)
		}

		this.loadingOlder = false
	}

	textInput(event: Event) {
		this.text = (event.target as HTMLTextAreaElement).value
	}

	/** Enter sends the message, Shift + Enter adds a new line */
	textKeydown(event: KeyboardEvent) {
		if (event.key == "Enter" && !event.shiftKey && !event.isComposing) {
			event.preventDefault()
			this.send()
		}
	}

	async send() {
		const text = this.text.trim()
		if (text.length == 0 || this.sending || this.chat == null) return

		this.sending = true
		this.sendError = false

		try {
			const message = await this.apiService.sendChatMessage(this.chat.uuid, text)

			this.text = ""
			this.addMessages([message])
			this.scrollToBottom()
		} catch (error) {
			console.error(error)
			this.sendError = true
		}

		this.sending = false
	}

	/** Loads the new messages of the partner */
	private async poll() {
		if (this.polling || this.chat == null || document.hidden) return
		this.polling = true

		try {
			const last = this.messages[this.messages.length - 1]
			const list = await this.apiService.listChatMessages(
				last != null
					? { chatUuid: this.chat.uuid, after: last.uuid }
					: { chatUuid: this.chat.uuid }
			)

			const newMessages = this.addMessages(list.items)

			if (newMessages.length > 0) {
				const container = this.messagesContainer?.nativeElement
				const atBottom =
					container == null ||
					container.scrollHeight - container.scrollTop - container.clientHeight < 80

				if (atBottom) this.scrollToBottom()
				if (newMessages.some(message => !message.mine)) await this.markAsRead()
			}
		} catch (error) {
			console.error(error)
		}

		this.polling = false
	}

	/** Adds the messages that are not in the list yet and returns them */
	private addMessages(messages: ChatMessage[]): ChatMessage[] {
		const known = new Set(this.messages.map(message => message.uuid))
		const newMessages = messages.filter(message => !known.has(message.uuid))

		if (newMessages.length > 0) {
			this.setMessages(this.messages.concat(newMessages))
		}

		return newMessages
	}

	private setMessages(messages: ChatMessage[]) {
		this.messages = messages
		this.messageGroups = []

		const today = new Date().toDateString()
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

		for (const message of messages) {
			const date = new Date(message.createdAt)
			const dateString = date.toDateString()
			const day =
				dateString == today
					? this.locale.today
					: dateString == yesterday
						? this.locale.yesterday
						: date.toLocaleDateString(this.localizationService.language)

			const group = this.messageGroups[this.messageGroups.length - 1]

			if (group?.day == day) {
				group.messages.push(message)
			} else {
				this.messageGroups.push({ day, messages: [message] })
			}
		}
	}

	private async markAsRead() {
		try {
			await this.apiService.markChatAsRead(this.chat.uuid)
			await this.chatService.refreshUnreadCount()
		} catch (error) {
			console.error(error)
		}
	}

	private scrollToBottom() {
		// Wait until the new messages are rendered
		setTimeout(() => {
			const container = this.messagesContainer?.nativeElement
			if (container != null) container.scrollTop = container.scrollHeight
		})
	}

	showLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.href)
	}
}
