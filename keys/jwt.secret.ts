// Fichier : backend/src/keys/jwt.secret.ts
import { readFileSync } from 'fs';
import { join } from 'path';

export const PRIVATE_KEY = readFileSync(join(__dirname, '..', '..', 'keys', 'private.key'), 'utf8');
export const PUBLIC_KEY = readFileSync(join(__dirname, '..', '..', 'keys', 'public.key'), 'utf8');