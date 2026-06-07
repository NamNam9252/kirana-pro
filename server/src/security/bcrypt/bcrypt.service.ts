import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptService {
  private saltRounds?: number;

  private getSaltRounds() {
    if (this.saltRounds) {
      return this.saltRounds;
    }

    const rawSaltRounds = process.env.BCRYPT_SALT_ROUNDS;
    const parsedSaltRounds = Number(rawSaltRounds);

    if (!rawSaltRounds || Number.isNaN(parsedSaltRounds) || parsedSaltRounds <= 0) {
      throw new Error('BCRYPT_SALT_ROUNDS must be a positive number');
    }

    this.saltRounds = parsedSaltRounds;
    return parsedSaltRounds;
  }

  hash(password: string) {
    return bcrypt.hash(password, this.getSaltRounds());
  }

  compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
