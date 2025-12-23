import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(private prisma: PrismaService) {}

  // --- NOUVELLE MÉTHODE : RÉCUPÉRER LE NOM DU CONCOURS ---
  async getDashboardConcoursName(userId: string) {
    this.logger.log(`🔍 Récupération du nom du concours pour userId: ${userId}`);
    
    const enrollment = await this.prisma.enrollement.findFirst({
      where: { candidat: { userId: userId } },
      select: {
        concours: {
          select: { intitule: true }
        }
      }
    });

    if (!enrollment) {
      throw new NotFoundException("Aucune inscription trouvée pour ce candidat.");
    }

    return { intitule: enrollment.concours.intitule };
  }

  // --- NOUVELLE MÉTHODE : RÉCUPÉRER LA DATE DU COMPTE À REBOURS ---
  async getDashboardCountdown(userId: string) {
    this.logger.log(`⏳ Récupération de la date de session pour userId: ${userId}`);
    
    // On cherche l'enrollement, puis on remonte : Enrollement -> Concours -> Session
    const enrollment = await this.prisma.enrollement.findFirst({
      where: { candidat: { userId: userId } },
      include: {
        concours: {
          include: {
            session: true // La date se trouve ici
          }
        }
      }
    });

    if (!enrollment || !enrollment.concours?.session) {
      this.logger.error(`❌ Session introuvable pour le concours lié au candidat ${userId}`);
      throw new NotFoundException("Date du concours (session) non définie.");
    }

    return {
      dateTarget: enrollment.concours.session.dateDebut,
    };
  }

  // --- TA MÉTHODE EXISTANTE (findAllDetailed) ---
  async findAllDetailed(query: { 
    search?: string, 
    filiereId?: string, 
    sexe?: any,
    page?: number,
    limit?: number 
  }) {
    // ... (Le reste de ton code reste inchangé)
    this.logger.log('📥 findAllDetailed() called');
    const { search, filiereId, sexe, page = 1, limit = 10 } = query;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: Prisma.CandidateWhereInput = {
      AND: [
        search ? {
          OR: [
            { user: { nom: { contains: search, mode: 'insensitive' } } },
            { user: { prenom: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { matricule: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        sexe ? { sexe } : {},
        filiereId ? {
          specialites: {
            some: {
              specialite: {
                filiereId
              }
            }
          }
        } : {},
      ]
    };

    try {
      const [candidates, total] = await Promise.all([
        this.prisma.candidate.findMany({
          where,
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                telephone: true,
                email: true,
              }
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
              },
              take: 1
            },
            specialites: {
              include: {
                specialite: {
                  include: {
                    filiere: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
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
      this.logger.error('❌ Erreur lors de la récupération des candidats', error);
      throw error;
    }
  }
}