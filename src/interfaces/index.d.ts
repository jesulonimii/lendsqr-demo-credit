export {}


declare global {

	interface IServiceError extends Error {
		code?: number
		message: string
	}

	interface IPagination {
		page: number
		limit: number
		skip: number
	}


}


