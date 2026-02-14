import { JwtPayload } from "./jwt.ts";

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}
