import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RoleModule } from './role/role.module';
import { DepartementModule } from './departement/departement.module';
import { NotificationModule } from './notification/notification.module';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { AnneeAcademiqueModule } from './annee-academique/annee-academique.module';
import { SessionModule } from './session/session.module';
import { PermissionModule } from './permission/permission.module';
import { ConcoursModule } from './concours/concours.module';
import { PaiementModule } from './paiement/paiement.module';
import { FiliereModule } from './filiere/filiere.module';
import { NiveauModule } from './niveau/niveau.module';
import { EpreuveModule } from './epreuve/epreuve.module';
import { ArchiveModule } from './archive/archive.module';

@Module({
  imports: [
    // ✅ Configuration des fichiers statiques (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Configuration globale de l'environnement
    ConfigModule.forRoot({ isGlobal: true }),

    // Modules de l'application
    EmailModule,
    AuthModule,
    PrismaModule,
    JwtModule,

    // Multer global pour upload fichiers
    MulterModule.register({
      dest: './uploads',
    }),

    RoleModule,
    DepartementModule,
    NotificationModule,
    AnneeAcademiqueModule,
    RolePermissionModule,
    SessionModule,
    PermissionModule,
    ConcoursModule,
    PaiementModule,
    FiliereModule,
    NiveauModule,
    EpreuveModule,
    ArchiveModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}