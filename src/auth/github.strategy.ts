import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      // L'ajout du "!" garantit à TypeScript que la variable existe dans le .env
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'], 
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { username, emails, photos, displayName } = profile;
    
    // Sécurité : on vérifie si emails existe avant d'accéder à l'index [0]
    const userEmail = emails && emails.length > 0 ? emails[0].value : null;

    // On prépare un objet utilisateur standardisé pour ton AuthService
    const user = {
      email: userEmail,
      nom: displayName || username,
      photo: photos && photos.length > 0 ? photos[0].value : null,
      provider: 'github',
      externalId: profile.id,
    };
    
    console.log(`[GITHUB-STRATEGY] Tentative de connexion de: ${user.email}`);
    
    done(null, user);
  }
}