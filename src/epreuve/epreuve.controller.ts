import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EpreuveService } from './epreuve.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { UpdateEpreuveDto } from './dto/update-epreuve.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('epreuves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EpreuveController {
  constructor(private readonly epreuveService: EpreuveService) {}

  @Post()
  @Permissions('creer_epreuve')
  create(@Body() createEpreuveDto: CreateEpreuveDto) {
    return this.epreuveService.create(createEpreuveDto);
  }

  /**
   * Récupère toutes les épreuves avec pagination et filtres
   * @Query page : numéro de la page (défaut 1)
   * @Query limit : nombre d'éléments par page (défaut 10)
   * @Query search : recherche par nom d'épreuve
   * @Query filiereId : filtre par filière spécifique
   */
  @Get()
  @Public()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('filiereId') filiereId?: string,
  ) {
    return this.epreuveService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      filiereId,
    });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.epreuveService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_epreuve')
  update(@Param('id') id: string, @Body() updateEpreuveDto: UpdateEpreuveDto) {
    return this.epreuveService.update(id, updateEpreuveDto);
  }

  @Delete(':id')
  @Permissions('supprimer_epreuve')
  remove(@Param('id') id: string) {
    return this.epreuveService.remove(id);
  }

  // 🔹 Épreuves par spécialité
  @Get('specialite/:specialiteId')
  @Public()
  findBySpecialite(@Param('specialiteId') specialiteId: string) {
    return this.epreuveService.findBySpecialite(specialiteId);
  }
}