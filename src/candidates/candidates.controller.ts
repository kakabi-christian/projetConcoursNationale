import { Controller, Get, Query } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { Public } from 'src/auth/decorators/public.decorator';
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get('list-detailed')
  @Public()
  async getDetailedList(
    @Query('search') search?: string,
    @Query('filiereId') filiereId?: string,
    @Query('sexe') sexe?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // 1. Appel au service (qui retourne { data, meta })
    const result = await this.candidatesService.findAllDetailed({
      search,
      filiereId,
      sexe: sexe as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    // 2. Formatage des données pour un Frontend propre
    const formattedCandidates = result.data.map(c => ({
      id: c.id,
      matricule: c.matricule || 'N/A',
      nom: c.user?.nom || '',
      prenom: c.user?.prenom || '',
      telephone: c.user?.telephone || 'N/A',
      sexe: c.sexe,
      dateNaissance: c.dateNaissance,
      lieuNaissance: c.lieuNaissance,
      // Accès sécurisé aux relations
      numeroRecu: c.recus && c.recus.length > 0 ? c.recus[0].numeroRecu : 'Aucun',
      centreExamen: c.enrollements && c.enrollements.length > 0 
        ? c.enrollements[0].centreExamen?.intitule 
        : 'Non assigné',
      centreDepot: c.enrollements && c.enrollements.length > 0 
        ? c.enrollements[0].centreDepot?.intitule 
        : 'Non assigné',
      filiere: c.specialites && c.specialites.length > 0 
        ? c.specialites[0].specialite?.filiere?.intitule 
        : 'N/A'
    }));

    // 3. Retourne l'objet combiné (Données + Pagination)
    return {
      candidates: formattedCandidates,
      pagination: result.meta
    };
  }
}