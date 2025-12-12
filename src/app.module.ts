import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';


// 🔹 Multer pour upload audio
import { MulterModule } from '@nestjs/platform-express';

// 🔹 Tes guards globaux
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
@Module({
  imports: [
    // 🔸 Configuration globale de l’environnement
    ConfigModule.forRoot({ isGlobal: true }),

    // 🔸 Modules de ton application
    EmailModule,
    AuthModule,
    PrismaModule,
    JwtModule,
    

    // 🔸 Multer global pour upload fichiers
    MulterModule.register({
      dest: './uploads', // dossier temporaire pour stocker les fichiers audio
    }),

    // 🔸 Servir le dossier uploads en statique pour accès depuis Flutter
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // accessible via http://localhost:3000/uploads/xxx.mp3
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

    
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // ✅ Application globale des guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
