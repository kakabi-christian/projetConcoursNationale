import { Controller, Get } from '@nestjs/common';
import { StatistiqueService } from './statistique.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('statistique')
@Roles('ADMIN')
export class StatistiqueController {
  constructor(private readonly statistiqueService: StatistiqueService) {}

  // ===================== CANDIDATS =====================
  @Get('total-candidats')
  @Public()
  async totalCandidats() {
    return this.statistiqueService.totalCandidats();
  }

  @Get('sexe')
  @Public()
  async sexeCandidats() {
    return this.statistiqueService.sexeCandidats();
  }

  @Get('pourcentage-sexe')
  @Public()
  async pourcentageSexe() {
    return this.statistiqueService.pourcentageSexe();
  }

  @Get('candidats-par-specialite')
  @Public()
  async candidatsParSpecialite() {
    return this.statistiqueService.candidatsParSpecialite();
  }

  @Get('candidats-par-filiere')
  @Public()
  async candidatsParFiliere() {
    return this.statistiqueService.candidatsParFiliere();
  }

  @Get('candidats-par-type-bac')
  @Public()
  async candidatsParTypeBac() {
    return this.statistiqueService.candidatsParTypeBac();
  }

  @Get('candidats-par-mention')
  @Public()
  async candidatsParMention() {
    return this.statistiqueService.candidatsParMention();
  }

  // ===================== CONCOURS =====================
  @Get('candidats-par-concours')
  @Public()
  async candidatsParConcours() {
    return this.statistiqueService.candidatsParConcours();
  }

  @Get('statut-paiements-par-concours')
  @Public()
  async statutPaiementsParConcours() {
    return this.statistiqueService.statutPaiementsParConcours();
  }

  // ===================== SESSIONS =====================
  @Get('candidats-par-session')
  @Public()
  async candidatsParSession() {
    return this.statistiqueService.candidatsParSession();
  }

  // ===================== PAIEMENTS =====================
  @Get('total-paiements')
  @Public()
  async totalPaiements() {
    return this.statistiqueService.totalPaiements();
  }

  @Get('paiements-par-mode')
  @Public()
  async paiementsParMode() {
    return this.statistiqueService.paiementsParMode();
  }

  @Get('nombre-paiements-statut')
  @Public()
  async nombrePaiementsStatut() {
    return this.statistiqueService.nombrePaiementsStatut();
  }

  // ===================== REÇUS =====================
  @Get('stats-recus')
  @Public()
  async statsRecus() {
    return this.statistiqueService.statsRecus();
  }

  // ===================== ADMIN / UTILISATEURS =====================
  @Get('admins-vs-candidats')
  @Public()
  async totalAdminsVsCandidats() {
    return this.statistiqueService.totalAdminsVsCandidats();
  }

  @Get('utilisateurs-verifies')
  @Public()
  async utilisateursVerifies() {
    return this.statistiqueService.utilisateursVerifies();
  }

  // ===================== FEEDBACKS / NOTIFICATIONS =====================
  @Get('feedbacks-par-utilisateur')
  @Public()
  async feedbacksParUtilisateur() {
    return this.statistiqueService.feedbacksParUtilisateur();
  }

  @Get('notifications-stat')
  @Public()
  async notificationsStat() {
    return this.statistiqueService.notificationsStat();
  }

  // ===================== STATISTIQUES COMBINÉES =====================
  @Get('dashboard')
  @Public()
  async statistiquesTableauDeBord() {
    return this.statistiqueService.statistiquesTableauDeBord();
  }
  // ===================== NOUVELLES ROUTES DE STATISTIQUES =====================

  @Get('regions-detaillees')
  @Public()
  async candidatsParRegionDetaille() {
    return this.statistiqueService.candidatsParRegionDetaille();
  }

  @Get('tranches-age')
  @Public()
  async candidatsParTrancheAge() {
    return this.statistiqueService.candidatsParTrancheAge();
  }

  @Get('stats-centres-examen')
  @Public()
  async statsParCentreExamen() {
    return this.statistiqueService.statsParCentreExamen();
  }

  @Get('stats-centres-depot')
  @Public()
  async statsParCentreDepot() {
    return this.statistiqueService.statsParCentreDepot();
  }

  @Get('taux-conversion')
  @Public()
  async tauxConversionPaiement() {
    return this.statistiqueService.tauxConversionPaiement();
  }
}
