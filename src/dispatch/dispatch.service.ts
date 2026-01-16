import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DispatchCandidatesDto } from './dto/dispach-candidat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private prisma: PrismaService) {}

  async dispatchCandidates(dto: DispatchCandidatesDto) {
    const { concoursId, centreExamenId, salleIds } = dto;

    // 1. Récupérer les candidats validés pour ce concours et ce centre
    const candidates = await this.prisma.enrollement.findMany({
      where: {
        concoursId,
        centreExamenId,
        candidat: {
          dossier: { statut: 'VALIDATED' }
        }
      },
      include: { candidat: { include: { user: true } } },
      orderBy: { candidat: { user: { nom: 'asc' } } } // Tri alphabétique par nom
    });

    if (candidates.length === 0) {
      throw new BadRequestException("Aucun candidat validé trouvé pour ce centre.");
    }

    // 2. Récupérer les salles et leur capacité
    const salles = await this.prisma.salle.findMany({
      where: { id: { in: salleIds } },
      orderBy: { codeClasse: 'asc' }
    });

    const capaciteTotale = salles.reduce((sum, s) => sum + s.capacite, 0);

    // 3. Vérification de sécurité (Candidats vs Capacité)
    if (candidates.length > capaciteTotale) {
      throw new BadRequestException(
        `Capacité insuffisante. Candidats: ${candidates.length}, Places disponibles: ${capaciteTotale}`
      );
    }

    // 4. ALGORITHME DE RÉPARTITION
    // On déclare les variables une seule fois ici
    const updates: Prisma.PrismaPromise<any>[] = [];
    let candidatIndex = 0;

    for (const salle of salles) {
      // Pour chaque salle, on remplit jusqu'à sa capacité
      for (let table = 1; table <= salle.capacite; table++) {
        // Si on a placé tous les candidats, on arrête tout
        if (candidatIndex >= candidates.length) break;

        const currentCandidat = candidates[candidatIndex];
        
        // Ajout de l'opération d'update dans la liste des promesses
        updates.push(
          this.prisma.enrollement.update({
            where: { id: currentCandidat.id },
            data: {
              salleId: salle.id,
              numeroTable: table
            }
          })
        );

        // Passer au candidat suivant
        candidatIndex++;
      }
      
      // Sécurité : si on a fini de placer tout le monde, on sort aussi de la boucle des salles
      if (candidatIndex >= candidates.length) break;
    }

    // 5. Exécution de toutes les mises à jour dans une transaction (Tout ou rien)
    try {
      await this.prisma.$transaction(updates);
      
      this.logger.log(`✅ Dispatching réussi : ${candidates.length} candidats répartis.`);

      return {
        message: "Dispatching terminé avec succès",
        stats: {
          candidatsPlaces: candidates.length,
          sallesUtilisees: salles.length,
          placesRestantes: capaciteTotale - candidates.length
        }
      };
    } catch (error) {
      this.logger.error("❌ Erreur lors de la transaction de dispatching", error);
      throw new BadRequestException("Une erreur est survenue lors de l'affectation des places.");
    }
  }
}