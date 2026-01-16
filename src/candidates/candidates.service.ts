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

  // --- RECHERCHE DÉTAILLÉE AVEC SALLES ET CENTRES ---
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
    this.logger.log('📥 findAllDetailed() called with alphabetical sorting and room info');
    const { 
      search, filiereId, specialiteId, centreExamenId, 
      centreDepotId, sexe, statut, page = 1, limit = 10 
    } = query;
    
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const andFilters: Prisma.CandidateWhereInput[] = [];

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
    if (statut && statut !== "") andFilters.push({ dossier: { statut: statut as DocStatus } });
    if (centreExamenId && centreExamenId !== "") andFilters.push({ enrollements: { some: { centreExamenId } } });
    if (centreDepotId && centreDepotId !== "") andFilters.push({ enrollements: { some: { centreDepotId } } });
    if (filiereId && filiereId !== "") andFilters.push({ specialites: { some: { specialite: { filiereId } } } });
    if (specialiteId && specialiteId !== "") andFilters.push({ specialites: { some: { specialiteId } } });

    const where: Prisma.CandidateWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

    try {
      const [candidates, total] = await Promise.all([
        this.prisma.candidate.findMany({
          where,
          include: {
            user: {
              select: { nom: true, prenom: true, telephone: true, email: true }
            },
            dossier: {
              select: { statut: true, commentaire: true, updatedAt: true }
            },
            enrollements: {
              include: { 
                centreExamen: true, 
                centreDepot: true,
                concours: true,
                // ✅ AJOUT : On récupère la salle et le bâtiment pour le dispatching
                salle: {
                  include: { batiment: true }
                }
              },
              take: 1
            },
            specialites: {
              include: {
                specialite: { include: { filiere: true } }
              }
            }
          },
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
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des candidats', error);
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

  // --- GÉNÉRATION PDF AVEC INFOS DE SALLES (ADMIN) ---
  async exportToPdf(query: any) {
    this.logger.log('📄 Génération du PDF avec colonnes Salle/Table...');

    const result = await this.findAllDetailed({ ...query, page: 1, limit: 10000 });
    const candidates = result.data;

    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();

    const institutionName = "ESTLC";
    const totalPagesExp = "{total_pages_count_string}";

    autoTable(doc, {
      // ✅ AJOUT : Colonnes Salle et Table au lieu de Filière
      head: [['N°', 'Matricule', 'Nom', 'Prénom', 'Salle', 'Table']],
      body: candidates.map((c, index) => {
        const enrollment = c.enrollements?.[0];
        return [
          index + 1,
          c.matricule || 'N/A',
          c.user?.nom?.toUpperCase() || '',
          c.user?.prenom || '',
          enrollment?.salle?.codeClasse || 'Non assigné',
          enrollment?.numeroTable || '-'
        ];
      }),
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text(institutionName, data.settings.margin.left, 15);
        doc.setFontSize(10);
        doc.text("Liste d'émargement des candidats par salle", data.settings.margin.left, 22);
        doc.line(data.settings.margin.left, 25, 196, 25);

        let str = "Page " + doc.internal.getNumberOfPages();
        if (typeof doc.putTotalPages === 'function') str += " / " + totalPagesExp;
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    if (typeof doc.putTotalPages === 'function') doc.putTotalPages(totalPagesExp);

    return Buffer.from(doc.output('arraybuffer'));
  }
}