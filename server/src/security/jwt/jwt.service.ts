import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Role } from 'src/enum/role.enum';

export interface AuthTokenPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtService {
  private secret?: string;
  private options?: jwt.SignOptions;

  private getSecret() {
    if (this.secret) {
      return this.secret;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    this.secret = secret;
    const expiresIn = process.env.JWT_EXPIRES_IN;
    if (expiresIn) {
      this.options = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
    }

    return secret;
  }

  sign(payload: AuthTokenPayload) {
    return jwt.sign(payload, this.getSecret(), this.options);
  }

  verify<T extends AuthTokenPayload = AuthTokenPayload>(token: string) {
    return jwt.verify(token, this.getSecret()) as T;
  }
}
