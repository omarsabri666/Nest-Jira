import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class HashingService {
  private readonly SALT_ROUNDS = 12;

  async hash(value: string): Promise<string> {
    return hash(value, this.SALT_ROUNDS);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return compare(value, hashedValue);
  }
}
