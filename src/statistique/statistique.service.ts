import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatistiqueService {
  constructor(private prisma: PrismaService) {}

  // ===================== CANDIDATS =====================
  async totalCandidats() {
    return this.prisma.candidate.count();
  }

  async sexeCandidats() {
    const masculins = await this.prisma.candidate.count({ where: { sexe: 'MASCULIN' } });
    const feminins = await this.prisma.candidate.count({ where: { sexe: 'FEMININ' } });
    return { masculins, feminins };
  }

  async pourcentageSexe() {
    const total = await this.totalCandidats();
    const { masculins, feminins } = await this.sexeCandidats();
    return {
      masculins: ((masculins / total) * 100).toFixed(2),
      feminins: ((feminins / total) * 100).toFixed(2),
    };
  }

  async candidatsParSpecialite() {
    const data = await this.prisma.candidatSpecialite.findMany({
      include: { specialite: true, candidat: true },
    });

    const result = data.reduce((acc, cs) => {
      const lib = cs.specialite.libelle;
      if (!acc[lib]) acc[lib] = { total: 0, filles: 0, garçons: 0 };
      acc[lib].total += 1;
      if (cs.candidat.sexe === 'FEMININ') acc[lib].filles += 1;
      else if (cs.candidat.sexe === 'MASCULIN') acc[lib].garçons += 1;
      return acc;
    }, {});

    return result;
  }

  async candidatsParFiliere() {
    const filieres = await this.prisma.filiere.findMany({ include: { specialites: { include: { candidats: { include: { candidat: true } } } } } });
    const result = filieres.map(f => {
      let total = 0, filles = 0, garçons = 0;
      f.specialites.forEach(s => {
        s.candidats.forEach(cs => {
          total++;
          if (cs.candidat.sexe === 'FEMININ') filles++;
          else if (cs.candidat.sexe === 'MASCULIN') garçons++;
        });
      });
      return { filiere: f.intitule, total, filles, garçons };
    });
    return result;
  }

  async candidatsParRegion() {
    const regions = await this.prisma.candidate.groupBy({
      by: ['userId'],
      _count: { id: true },
    });
    return regions; // tu peux transformer selon tes besoins
  }

  async candidatsParTypeBac() {
    const data = await this.prisma.documents.groupBy({
      by: ['typeExamen'],
      _count: { id: true },
    });
    return data;
  }

  async candidatsParMention() {
    const data = await this.prisma.documents.groupBy({
      by: ['Mention'],
      _count: { id: true },
    });
    return data;
  }

  // ===================== CONCOURS =====================
  async candidatsParConcours() {
    const concours = await this.prisma.concours.findMany({
      include: { enrollements: true, paiements: true },
    });
    return concours.map(c => ({
      concours: c.intitule,
      nbCandidats: c.enrollements.length,
      montantTotal: c.paiements.reduce((acc, p) => acc + (p.montantTotal ?? 0), 0),
      montantMoyen: c.paiements.length > 0 ? c.paiements.reduce((acc, p) => acc + (p.montantTotal ?? 0), 0) / c.paiements.length : 0,
    }));
  }

  async statutPaiementsParConcours() {
    const concours = await this.prisma.concours.findMany({ include: { paiements: true } });
    return concours.map(c => {
      const statusCount = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
      c.paiements.forEach(p => { statusCount[p.statut] = (statusCount[p.statut] || 0) + 1; });
      return { concours: c.intitule, ...statusCount };
    });
  }

  // ===================== SESSIONS =====================
  async candidatsParSession() {
    const sessions = await this.prisma.session.findMany({ include: { enrollements: { include: { candidat: true } } } });
    return sessions.map(s => {
      let filles = 0, garçons = 0;
      s.enrollements.forEach(e => {
        if (e.candidat.sexe === 'FEMININ') filles++;
        else if (e.candidat.sexe === 'MASCULIN') garçons++;
      });
      return { session: s.nom, total: s.enrollements.length, filles, garçons };
    });
  }

  // ===================== PAIEMENTS =====================
  async totalPaiements() {
    const total = await this.prisma.paiement.aggregate({ _sum: { montantTotal: true } });
    return total._sum.montantTotal || 0;
  }

  async paiementsParMode() {
    const modes = await this.prisma.paiement.groupBy({
      by: ['modePaiement'],
      _sum: { montantTotal: true },
      _count: { id: true },
    });
    return modes;
  }

  async nombrePaiementsStatut() {
    const statuts = await this.prisma.paiement.groupBy({
      by: ['statut'],
      _count: { id: true },
    });
    return statuts;
  }

  // ===================== REÇUS =====================
  async statsRecus() {
    const totalRecus = await this.prisma.recu.count();
    const utilisés = await this.prisma.recu.count({ where: { estUtilise: true } });
    const nonUtilisés = totalRecus - utilisés;
    const montantTotal = await this.prisma.recu.aggregate({ _sum: { montant: true } });
    return { totalRecus, utilisés, nonUtilisés, montantTotal: montantTotal._sum.montant || 0 };
  }

  // ===================== ADMIN / UTILISATEURS =====================
  async totalAdminsVsCandidats() {
    const admins = await this.prisma.admin.count();
    const candidats = await this.prisma.candidate.count();
    return { admins, candidats };
  }

  async utilisateursVerifies() {
    const verifies = await this.prisma.user.count({ where: { isVerified: true } });
    const nonVerifies = await this.prisma.user.count({ where: { isVerified: false } });
    return { verifies, nonVerifies };
  }

  // ===================== FEEDBACKS / NOTIFICATIONS =====================
  async feedbacksParUtilisateur() {
    const feedbacks = await this.prisma.feedback.groupBy({ by: ['userId'], _count: { id: true } });
    return feedbacks;
  }

  async notificationsStat() {
    const notifications = await this.prisma.notifications.groupBy({ by: ['type'], _count: { id: true } });
    return notifications;
  }

  // ===================== STATISTIQUES COMBINÉES =====================
  async statistiquesTableauDeBord() {
    const [sexe, specialites, filieres, paiements, mentions] = await Promise.all([
      this.sexeCandidats(),
      this.candidatsParSpecialite(),
      this.candidatsParFiliere(),
      this.totalPaiements(),
      this.candidatsParMention(),
    ]);

    return { sexe, specialites, filieres, paiements, mentions };
  }

  // ===================== NOUVELLES STATISTIQUES (MISE À JOUR) =====================

  /**
   * Statistiques détaillées par Région (basé sur le champ région de l'utilisateur)
   */
  async candidatsParRegionDetaille() {
    const data = await this.prisma.user.findMany({
      where: { candidate: { isNot: null } },
      select: {
        region: true,
        candidate: { select: { sexe: true } }
      }
    });

    return data.reduce((acc, curr) => {
      const reg = curr.region || 'NON_RENSEIGNEE';
      if (!acc[reg]) acc[reg] = { total: 0, filles: 0, garcons: 0 };
      
      acc[reg].total += 1;
      if (curr.candidate?.sexe === 'FEMININ') acc[reg].filles += 1;
      else if (curr.candidate?.sexe === 'MASCULIN') acc[reg].garcons += 1;
      
      return acc;
    }, {});
  }

  /**
   * Analyse des tranches d'âge des candidats
   */
  async candidatsParTrancheAge() {
    const candidates = await this.prisma.candidate.findMany({
      select: { dateNaissance: true }
    });

    const categories = { '15-20': 0, '21-25': 0, '26-30': 0, '31+': 0, 'Inconnu': 0 };
    const yearNow = new Date().getFullYear();

    candidates.forEach(c => {
      if (!c.dateNaissance) { categories['Inconnu']++; return; }
      const age = yearNow - new Date(c.dateNaissance).getFullYear();
      if (age <= 20) categories['15-20']++;
      else if (age <= 25) categories['21-25']++;
      else if (age <= 30) categories['26-30']++;
      else categories['31+']++;
    });

    return categories;
  }

  /**
   * Taux d'occupation et répartition par Centre d'Examen
   */
  async statsParCentreExamen() {
    const centres = await this.prisma.centreExamen.findMany({
      include: { 
        enrollements: {
          select: { candidat: { select: { sexe: true } } }
        } 
      }
    });

    return centres.map(c => ({
      centre: c.intitule,
      total: c.enrollements.length,
      filles: c.enrollements.filter(e => e.candidat?.sexe === 'FEMININ').length,
      garcons: c.enrollements.filter(e => e.candidat?.sexe === 'MASCULIN').length
    }));
  }

  /**
   * Statistiques de réception des dossiers par Centre de Dépôt
   */
  async statsParCentreDepot() {
    const depots = await this.prisma.centreDepot.findMany({
      include: { 
        _count: { select: { enrollements: true } } 
      }
    });

    return depots.map(d => ({
      nom: d.intitule,
      lieu: d.lieuDepot,
      nbDossiers: d._count.enrollements
    }));
  }

  /**
   * Taux de conversion : Inscrits vs Payés (SUCCESS)
   */
  async tauxConversionPaiement() {
    const totalCandidats = await this.prisma.candidate.count();
    const paiementsReussis = await this.prisma.paiement.count({
      where: { statut: 'SUCCESS' }
    });

    return {
      totalCandidats,
      paiementsReussis,
      tauxConversion: totalCandidats > 0 ? ((paiementsReussis / totalCandidats) * 100).toFixed(2) + '%' : '0%'
    };
  }
}
