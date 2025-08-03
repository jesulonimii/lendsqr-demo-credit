import type { FastifyReply, FastifyRequest } from "fastify"

interface Controller {
	(req: Request, res: Response): Promise<any>
}

interface Request extends FastifyRequest {}
interface Response extends FastifyReply {
	// Add any additional properties or methods you need
}

export function createController(controller: (request: Request, reply: Response) => Promise<any>): Controller {
	return (req: Request, res: Response) => controller(req, res)
}
