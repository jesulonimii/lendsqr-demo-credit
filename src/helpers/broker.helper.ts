import { EventEmitter } from "events"

export interface Message<T> {
	id: string
	userId: string
	input: T
	timestamp: number
	status: "pending" | "processing" | "completed" | "failed"
	result?: string
	error?: string
	retryCount?: number
}

export class MessageBroker<T> {
	private eventEmitter: EventEmitter
	private messages: Map<string, Message<T>>
	private processingCount: Map<string, number>
	private maxConcurrentProcessing: number
	private retryInterval: number = 1000 // 1 second

	constructor() {
		this.eventEmitter = new EventEmitter()
		this.messages = new Map()
		this.processingCount = new Map()
		this.maxConcurrentProcessing = 1
	}

	async publish(userId: string, input: T): Promise<string> {
		const messageId = crypto.randomUUID()
		const message: Message<T> = {
			id: messageId,
			userId,
			input,
			timestamp: Date.now(),
			status: "pending",
			retryCount: 0,
		}

		this.messages.set(messageId, message)
		this.eventEmitter.emit("messageQueued", message)

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(
				() => {
					this.eventEmitter.removeAllListeners(`completed:${messageId}`)
					this.eventEmitter.removeAllListeners(`failed:${messageId}`)
					reject(new Error("Message processing timeout"))
				},
				5 * 60 * 1000
			) // 5 minute timeout

			this.eventEmitter.once(`completed:${messageId}`, (result: string) => {
				clearTimeout(timeout)
				resolve(result)
			})

			this.eventEmitter.once(`failed:${messageId}`, (error: Error) => {
				clearTimeout(timeout)
				reject(error)
			})
		})
	}

	async subscribe(handler: (message: Message<T>) => Promise<any>): Promise<void> {
		this.eventEmitter.on("messageQueued", async (message: Message<T>) => {
			await this.processMessage(message, handler)
		})
	}

	getMessageStatus(messageId: string): Message<T> | undefined {
		return this.messages.get(messageId)
	}

	getUserMessages(userId: string): Message<T>[] {
		return Array.from(this.messages.values())
			.filter(message => message.userId === userId)
			.sort((a, b) => b.timestamp - a.timestamp)
	}

	clearOldMessages(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
		const now = Date.now()
		for (const [id, message] of this.messages.entries()) {
			if (now - message.timestamp > maxAgeMs) {
				this.messages.delete(id)
			}
		}
	}

	// Debug methods
	getProcessingCounts(): Map<string, number> {
		return new Map(this.processingCount)
	}

	getPendingMessages(): Message<T>[] {
		return Array.from(this.messages.values()).filter(message => message.status === "pending")
	}

	private async processMessage(message: Message<T>, handler: (message: Message<T>) => Promise<string>) {
		const userProcessingCount = this.processingCount.get(message.userId) || 0

		if (userProcessingCount >= this.maxConcurrentProcessing) {
			// Schedule retry
			setTimeout(() => {
				message.retryCount = (message.retryCount || 0) + 1
				this.eventEmitter.emit("messageQueued", message)
			}, this.retryInterval)
			return
		}

		try {
			// Update processing count
			this.processingCount.set(message.userId, userProcessingCount + 1)

			// Update message status
			message.status = "processing"
			this.messages.set(message.id, message)

			// Process message
			const result = await handler(message)

			// Update message with result
			message.status = "completed"
			message.result = result
			this.messages.set(message.id, message)

			// Emit completion event
			this.eventEmitter.emit(`completed:${message.id}`, result)
		} catch (error: any) {
			// Handle error
			message.status = "failed"
			message.error = error.message
			this.messages.set(message.id, message)

			// Emit failure event
			this.eventEmitter.emit(`failed:${message.id}`, error)
		} finally {
			// Decrease processing count
			this.processingCount.set(message.userId, (this.processingCount.get(message.userId) || 1) - 1)
		}
	}
}
