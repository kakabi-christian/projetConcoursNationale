import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { CryptoModule } from '../crypto/crypto.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { MulterModule } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    CryptoModule,
    MulterModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const privateKeyPath = configService.get<string>('JWT_PRIVATE_KEY_PATH');
        const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');
        const expiresInEnv = configService.get<string>('JWT_EXPIRATION_TIME') || '5h';

        if (!privateKeyPath || !publicKeyPath) {
          throw new Error('JWT keys must be defined in environment variables.');
        }

        const absolutePrivateKeyPath = path.resolve(process.cwd(), privateKeyPath);
        const absolutePublicKeyPath = path.resolve(process.cwd(), publicKeyPath);

        if (!fs.existsSync(absolutePrivateKeyPath) || !fs.existsSync(absolutePublicKeyPath)) {
          throw new Error(`JWT key files not found at ${absolutePrivateKeyPath} or ${absolutePublicKeyPath}`);
        }

        const privateKey = fs.readFileSync(absolutePrivateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(absolutePublicKeyPath, 'utf8');

        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: expiresInEnv as '30m' | '1h' | '15m', // <-- ici tu fixes un StringValue compatible
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService,JwtModule],
})
export class AuthModule {}
