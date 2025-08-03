import { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"

export class AxiosRequest {
	private instance: AxiosInstance = null
	private errorMessage = "Request Failed :::"
	private headers = {}

	constructor(
		instance: AxiosInstance,
		options?: {
			errorMessage?: string
			headers?: object
		}
	) {
		this.instance = instance
		this.errorMessage = options?.errorMessage ?? this.errorMessage
		this.headers = options?.headers ?? this.headers
	}

	public async get<T>(url: string, params?: any): Promise<T> {
		return this.makeRequest<T>("GET", url, undefined, params)
	}

	public async post<T>(url: string, data?: any): Promise<T> {
		return this.makeRequest<T>("POST", url, data)
	}

	public async delete<T>(url: string, params?: any): Promise<T> {
		return this.makeRequest<T>("DELETE", url, undefined, params)
	}

	private async makeRequest<T>(method: "POST" | "GET" | "DELETE", url: string, data?: any, params?: any): Promise<T> {
		const options: AxiosRequestConfig = {
			method,
			url,
			data,
			params,
			headers: {
				"Content-Type": data instanceof FormData ? "multipart/form-data" : "application/json",
			},
		}

		try {
			const response: AxiosResponse<T> = await this.instance.request<T>(options)
			return response.data
		} catch (error: any) {
			console.error(`${this.errorMessage}: `, error?.response?.data)
			throw error as AxiosError
		}
	}
}
