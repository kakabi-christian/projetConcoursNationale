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
import { PieceDossierModule } from './piece-dossier/piece-dossier.module';
import { SpecialiteModule } from './specialite/specialite.module';
import { CentreExamenModule } from './centre-examen/centre-examen.module';
import { CentreDepotService } from './centre-depot/centre-depot.service';
import { CentreDepotModule } from './centre-depot/centre-depot.module';
import { StatistiqueModule } from './statistique/statistique.module';
import { CandidatesModule } from './candidates/candidates.module';
import { FeebacksModule } from './feebacks/feebacks.module';
import { DossierModule } from './dossier/dossier.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BatimentModule } from './batiment/batiment.module';
import { SalleModule } from './salle/salle.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { CampayModule } from './campay/campay.module';

@Module({
  imports: [
    // ✅ CORRECTION ICI (IMPORTANT)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
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
    PieceDossierModule,
    SpecialiteModule,
    CentreExamenModule,
    CentreDepotModule,
    StatistiqueModule,
    CandidatesModule,
    FeebacksModule,
    DossierModule,
    WhatsappModule,
    BatimentModule,
    SalleModule,
    DispatchModule,
    AiModule,
    ChatModule,
    CampayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    CentreDepotService,
    
  ],
})
export class AppModule {}
