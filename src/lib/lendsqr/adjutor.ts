import Config from "@config"
import axios from "axios"
import { AxiosRequest } from "@lib/axios"

class Adjutor {
	private debug = Config.ENV === "development"
	private API_KEY: string = Config.LENDSQR_API_KEY

	private instance = axios.create({
		baseURL: "https://adjutor.lendsqr.com/v2",
		headers: {
			Authorization: `Bearer ${this?.API_KEY}`,
		},
	})
	private request = new AxiosRequest(this.instance, {
		errorMessage: "Adjutor API Error: ",
	})

	async checkKarma(identity: string): Promise<{
		status: string
		message: string
		data: {
			karma_identity: string
			amount_in_contention: string
			reason: string | null
			default_date: string
			karma_type: {
				karma: string
			}
			karma_identity_type: {
				identity_type: string
			}
			reporting_entity: {
				name: string
				email: string
			}
		}
		meta: {
			cost: number
			balance: number
		}
	}> {
		return this.request.get(`/verification/karma/${identity}`, {})
	}
}

export const adjutorApi = new Adjutor()

