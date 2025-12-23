import { Controller, Get, Param, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiQuery, 
  ApiResponse, 
  ApiParam
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Gestion des Candidats')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  // ======================================================
  // 1. ENDPOINT POUR LE NOM DU CONCOURS (DASHBOARD)
  // ======================================================
  @Public()
  @Get('dashboard/concours-info/:userId')
  @ApiOperation({ summary: 'Récupérer l’intitulé du concours pour le dashboard candidat' })
  @ApiParam({ name: 'userId', description: 'ID de l’utilisateur (User UUID)' })
  async getDashboardInfo(@Param('userId') userId: string) {
    return await this.candidatesService.getDashboardConcoursName(userId);
  }

  // ======================================================
  // 2. ENDPOINT POUR LE COUNTDOWN (DASHBOARD)
  // ======================================================
  @Public()
  @Get('dashboard/countdown/:userId')
  @ApiOperation({ summary: 'Récupérer la date cible du concours pour le compte à rebours' })
  @ApiParam({ name: 'userId', description: 'ID de l’utilisateur (User UUID)' })
  async getCountdown(@Param('userId') userId: string) {
    return await this.candidatesService.getDashboardCountdown(userId);
  }

  // ======================================================
  // 3. LISTE DÉTAILLÉE DES CANDIDATS (ADMIN)
  // ======================================================
  @Get('list-detailed')
  @Public()
  @ApiOperation({ summary: 'Récupérer une liste détaillée et formatée des candidats' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filiereId', required: false, type: String })
  @ApiQuery({ name: 'sexe', required: false, enum: ['MASCULIN', 'FEMININ'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Succès' })
  async getDetailedList(
    @Query('search') search?: string,
    @Query('filiereId') filiereId?: string,
    @Query('sexe') sexe?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // 1. Appel au service
    const result = await this.candidatesService.findAllDetailed({
      search,
      filiereId,
      sexe: sexe as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    // 2. Formatage pour le Frontend
    const formattedCandidates = result.data.map(c => ({
      id: c.id,
      matricule: c.matricule || 'N/A',
      nom: c.user?.nom || '',
      prenom: c.user?.prenom || '',
      telephone: c.user?.telephone || 'N/A',
      sexe: c.sexe,
      dateNaissance: c.dateNaissance,
      lieuNaissance: c.lieuNaissance,
      numeroRecu: c.recus?.[0]?.numeroRecu || 'Aucun',
      centreExamen: c.enrollements?.[0]?.centreExamen?.intitule || 'Non assigné',
      centreDepot: c.enrollements?.[0]?.centreDepot?.intitule || 'Non assigné',
      filiere: c.specialites?.[0]?.specialite?.filiere?.intitule || 'N/A'
    }));

    return {
      candidates: formattedCandidates,
      pagination: result.meta
    };
  }
}