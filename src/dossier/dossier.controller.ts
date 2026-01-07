import { 
  Controller, Get, Post, Body, Patch, Param, Query, 
  UseInterceptors, UploadedFile, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DossierService } from './dossier.service';
import { UpdateDossierStatusDto } from './dto/update-dossier-status.dto';
import { DocStatus } from '@prisma/client';

@Controller('dossiers')
export class DossierController {
  constructor(private readonly dossierService: DossierService) {}
  /**
   * Récupérer le nombre de dossiers en attente (Badge Admin)
   * GET /dossiers/count/pending
   */
  @Get('count/pending')
  getPendingCount() {
    return this.dossierService.countPendingDossiers();
  }

  // --- PARTIE ADMIN ---

  /**
   * Liste de tous les dossiers (Admin)
   * GET /dossiers?page=1&limit=10&statut=PENDING
   */
  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('statut') statut?: DocStatus,
  ) {
    return this.dossierService.findAll(+page || 1, +limit || 10, statut);
  }

  /**
   * Valider ou rejeter un dossier (Admin)
   * PATCH /dossiers/:candidateId/status
   */
  @Patch(':candidateId/status')
  updateStatus(
    @Param('candidateId') candidateId: string,
    @Body() dto: UpdateDossierStatusDto,
  ) {
    return this.dossierService.updateStatus(candidateId, dto);
  }

  // --- PARTIE CANDIDAT ---

  /**
   * Upload d'un document spécifique
   * POST /dossiers/upload/:candidateId/:field
   */
  @Post('upload/:candidateId/:field')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/dossiers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return cb(new BadRequestException('Seuls les fichiers JPG, PNG et PDF sont autorisés'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @Param('candidateId') candidateId: string,
    @Param('field') field: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    
    // On génère l'URL d'accès au fichier
    const fileUrl = `/uploads/dossiers/${file.filename}`;
    return this.dossierService.uploadFile(candidateId, field, fileUrl);
  }

  /**
   * Voir son propre dossier (Candidat)
   * GET /dossiers/my-dossier/:candidateId
   */
  @Get('my-dossier/:candidateId')
  getDossier(@Param('candidateId') candidateId: string) {
    return this.dossierService.getDossier(candidateId);
  }
}