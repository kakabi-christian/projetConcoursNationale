import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllDetailed(query: { 
    search?: string, 
    filiereId?: string, 
    sexe?: any,
    page?: number,
    limit?: number 
  }) {
    this.logger.log('📥 findAllDetailed() called');
    this.logger.debug(`Query reçu: ${JSON.stringify(query)}`);

    const { search, filiereId, sexe, page = 1, limit = 10 } = query;

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    this.logger.log(`📄 Pagination → page=${page}, limit=${take}, skip=${skip}`);

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

    this.logger.debug(`🧩 Filtre Prisma construit: ${JSON.stringify(where)}`);

    try {
      this.logger.log('🚀 Exécution des requêtes Prisma');

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

      this.logger.log(`✅ Requêtes terminées`);
      this.logger.log(`📊 Total candidats trouvés: ${total}`);
      this.logger.debug(`📦 Nombre de candidats retournés: ${candidates.length}`);

      const result = {
        data: candidates,
        meta: {
          total,
          page: Number(page),
          lastPage: Math.ceil(total / take),
          hasNextPage: skip + take < total,
          hasPreviousPage: page > 1
        }
      };

      this.logger.debug(`📤 Réponse finale prête`);
      return result;

    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des candidats', error);
      throw error;
    }
  }
}
