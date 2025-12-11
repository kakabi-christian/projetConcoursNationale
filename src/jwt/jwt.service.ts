import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtService {
  private readonly privateKey: jwt.Secret;
  private readonly publicKey: jwt.Secret;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor() {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

    if (!privateKeyPath || !publicKeyPath) {
      throw new Error(
        'JWT_PRIVATE_KEY_PATH et JWT_PUBLIC_KEY_PATH doivent être définis dans le .env',
      );
    }

    // Lire les fichiers PEM et forcer le type en jwt.Secret
    this.privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8') as jwt.Secret;
    this.publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf8') as jwt.Secret;

    // Expiration des tokens
    this.accessExpiration = process.env.JWT_EXPIRATION_TIME || '30m';
    this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '2d';
  }

  signAccessToken(payload: object): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessExpiration as jwt.SignOptions['expiresIn'],
    });
  }

  signRefreshToken(payload: object): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.refreshExpiration as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] });
    } catch (err) {
      throw new UnauthorizedException('Access token invalide ou expiré');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] });
    } catch (err) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }
}
