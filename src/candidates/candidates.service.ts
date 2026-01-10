import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, DocStatus } from '@prisma/client';
import autoTable from 'jspdf-autotable';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(private prisma: PrismaService) {}

  // --- RÉCUPÉRER LE NOM DU CONCOURS (Dashboard) ---
  async getDashboardConcoursName(userId: string) {
    this.logger.log(`🔍 Récupération du nom du concours pour userId: ${userId}`);
    const enrollment = await this.prisma.enrollement.findFirst({
      where: { candidat: { userId: userId } },
      select: {
        concours: { select: { intitule: true } }
      }
    });
    if (!enrollment) throw new NotFoundException("Aucune inscription trouvée.");
    return { intitule: enrollment.concours.intitule };
  }

  // --- RÉCUPÉRER LA DATE DU COMPTE À REBOURS (Dashboard) ---
  async getDashboardCountdown(userId: string) {
    this.logger.log(`⏳ Récupération de la date de session pour userId: ${userId}`);
    const enrollment = await this.prisma.enrollement.findFirst({
      where: { candidat: { userId: userId } },
      include: { concours: { include: { session: true } } }
    });
    if (!enrollment || !enrollment.concours?.session) {
      throw new NotFoundException("Date du concours non définie.");
    }
    return { dateTarget: enrollment.concours.session.dateDebut };
  }

  // --- MÉTHODE MISE À JOUR : Recherche avec filtres Filière, Spécialité & Statut Dossier ---
  // --- MÉTHODE MISE À JOUR : Ajout des filtres par Centre d'Examen et Centre de Dépôt ---
async findAllDetailed(query: { 
    search?: string, 
    filiereId?: string, 
    specialiteId?: string, 
    centreExamenId?: string, 
    centreDepotId?: string,  
    sexe?: any,
    statut?: string, 
    page?: number,
    limit?: number 
  }) {
    this.logger.log('📥 findAllDetailed() called with alphabetical sorting by name');
    const { 
      search, filiereId, specialiteId, centreExamenId, 
      centreDepotId, sexe, statut, page = 1, limit = 10 
    } = query;
    
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const andFilters: Prisma.CandidateWhereInput[] = [];

    // --- (Tes filtres restent identiques ici) ---
    if (search && search.trim() !== "") {
      andFilters.push({
        OR: [
          { user: { nom: { contains: search, mode: 'insensitive' } } },
          { user: { prenom: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { matricule: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (sexe && sexe !== "") andFilters.push({ sexe });

    if (statut && statut !== "") {
      andFilters.push({ dossier: { statut: statut as DocStatus } });
    }

    if (centreExamenId && centreExamenId !== "") {
      andFilters.push({ enrollements: { some: { centreExamenId } } });
    }

    if (centreDepotId && centreDepotId !== "") {
      andFilters.push({ enrollements: { some: { centreDepotId } } });
    }

    if (filiereId && filiereId !== "") {
      andFilters.push({ specialites: { some: { specialite: { filiereId } } } });
    }

    if (specialiteId && specialiteId !== "") {
      andFilters.push({ specialites: { some: { specialiteId } } });
    }

    const where: Prisma.CandidateWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

    try {
      const [candidates, total] = await Promise.all([
        this.prisma.candidate.findMany({
          where,
          include: {
            user: {
              select: {
                nom: true, prenom: true, telephone: true, email: true,
              }
            },
            dossier: {
              select: { statut: true, commentaire: true, updatedAt: true }
            },
            recus: {
              select: { numeroRecu: true },
              take: 1,
              orderBy: { createdAt: 'desc' }
            },
            enrollements: {
              include: { 
                centreExamen: true, 
                centreDepot: true,
                concours: true 
              },
              take: 1
            },
            specialites: {
              include: {
                specialite: {
                  include: { filiere: true }
                }
              }
            }
          },
          // 🚀 MODIFICATION ICI : Tri par Nom puis par Prénom
          orderBy: [
            { user: { nom: 'asc' } },
            { user: { prenom: 'asc' } }
          ],
          skip,
          take,
        }),
        this.prisma.candidate.count({ where })
      ]);

      return {
        data: candidates,
        meta: {
          total,
          page: Number(page),
          lastPage: Math.ceil(total / take),
          hasNextPage: skip + take < total,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des candidats filtrés', error);
      throw error;
    }
  }
  // --- RÉCUPÉRER LES SPÉCIALITÉS D'UNE FILIÈRE ---
  async getSpecialitesByFiliere(filiereId: string) {
    return this.prisma.specialite.findMany({
      where: { filiereId: filiereId },
      orderBy: { libelle: 'asc' }
    });
  }

  // --- RÉCUPÉRER TOUTES LES FILIÈRES ---
  async getFilieres() {
    return this.prisma.filiere.findMany({
      orderBy: { intitule: 'asc' }
    });
  }
  // --- GÉNÉRATION PDF PAGINÉ (ADMIN) ---
  async exportToPdf(query: any) {
    this.logger.log('📄 Génération du PDF des candidats...');

    // 1. On récupère TOUS les candidats correspondants aux filtres (sans pagination skip/take)
    // On réutilise la même logique que findAllDetailed mais pour la totalité
    const result = await this.findAllDetailed({ ...query, page: 1, limit: 10000 });
    const candidates = result.data;

    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    const doc = new jsPDF();

    // 2. Configuration du Header et du Footer (Pagination)
    const institutionName = "ESTLC"; // À personnaliser
    const totalPagesExp = "{total_pages_count_string}";

    autoTable(doc, {
      head: [['N°', 'Matricule', 'Nom', 'Prénom', 'Filière', 'Spécialité']],
      body: candidates.map((c, index) => [
        index + 1,
        c.matricule || 'N/A',
        c.user?.nom?.toUpperCase() || '',
        c.user?.prenom || '',
        c.specialites?.[0]?.specialite?.filiere?.intitule || 'N/A',
        c.specialites?.[0]?.specialite?.libelle || 'N/A'
      ]),
      startY: 30, // Laisse de la place pour le nom de l'institution
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }, // Bleu professionnel
      
      // Cette partie gère le nom de l'institution en haut et la page en bas
      didDrawPage: (data) => {
        // --- HEADER ---
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(institutionName, data.settings.margin.left, 15);
        doc.setFontSize(10);
        doc.text("Liste officielle des candidats inscrits", data.settings.margin.left, 22);
        doc.line(data.settings.margin.left, 25, 196, 25); // Ligne de séparation

        // --- FOOTER (PAGINATION) ---
        let str = "Page " + doc.internal.getNumberOfPages();
        if (typeof doc.putTotalPages === 'function') {
          str = str + " / " + totalPagesExp;
        }
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      },
    });

    // Remplace le placeholder par le nombre total de pages à la fin
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }

    return Buffer.from(doc.output('arraybuffer'));
  }
}