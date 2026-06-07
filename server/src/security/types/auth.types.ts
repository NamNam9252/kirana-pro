import { Request } from 'express';
import { AuthTokenPayload } from '../jwt/jwt.service';

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}
