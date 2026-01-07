import { Controller, Get, Param, Query, Res } from '@nestjs/common';
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
  // 3. NOUVEAU : RÉCUPÉRER LES SPÉCIALITÉS PAR FILIÈRE
  // ======================================================
  @Public()
  @Get('specialites/:filiereId')
  @ApiOperation({ summary: 'Récupérer les spécialités liées à une filière spécifique' })
  @ApiParam({ name: 'filiereId', description: 'ID de la filière' })
  async getSpecialites(@Param('filiereId') filiereId: string) {
    return await this.candidatesService.getSpecialitesByFiliere(filiereId);
  }

  // ======================================================
  // 4. LISTE DÉTAILLÉE DES CANDIDATS (ADMIN) - MISE À JOUR
  // ======================================================
  @Get('list-detailed')
  @Public()
  @ApiOperation({ summary: 'Récupérer une liste détaillée avec filtres filière et spécialité' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filiereId', required: false, type: String })
  @ApiQuery({ name: 'specialiteId', required: false, type: String }) // Nouveau filtre
  @ApiQuery({ name: 'sexe', required: false, enum: ['MASCULIN', 'FEMININ'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Succès' })
@Get('list-detailed')
  @Public()
  @ApiOperation({ summary: 'Récupérer une liste détaillée avec filtres' })
  // ... (tes autres ApiQuery)
  @ApiQuery({ name: 'statut', required: false, type: String }) // Ajoute ceci pour Swagger
  async getDetailedList(
    @Query('search') search?: string,
    @Query('filiereId') filiereId?: string,
    @Query('specialiteId') specialiteId?: string,
    @Query('sexe') sexe?: string,
    @Query('statut') statut?: string, // 1. AJOUTE CETTE LIGNE
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // 2. Transmet le statut au service
    const result = await this.candidatesService.findAllDetailed({
      search,
      filiereId,
      specialiteId,
      sexe: sexe as any,
      statut, // 3. TRANSMISSION ICI
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    const formattedCandidates = result.data.map(c => ({
      id: c.id,
      matricule: c.matricule || 'N/A',
      user: c.user, // Garde l'objet user complet pour le frontend
      nom: c.user?.nom || '',
      prenom: c.user?.prenom || '',
      sexe: c.sexe,
      dossier: c.dossier, // 4. INDISPENSABLE : Ajoute ceci pour que le badge fonctionne !
      filiere: c.specialites?.[0]?.specialite?.filiere?.intitule || 'N/A',
      specialite: c.specialites?.[0]?.specialite?.libelle || 'N/A'
    }));

    return {
      candidates: formattedCandidates,
      pagination: result.meta
    };
  }
  @Get('export/pdf')
  @Public()
  async downloadPdf(@Query() query: any, @Res() res: any) {
    const buffer = await this.candidatesService.exportToPdf(query);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=liste_candidats.pdf',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
  
}