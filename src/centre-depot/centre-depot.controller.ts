import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger'; // Imports Swagger
import { CentreDepotService } from './centre-depot.service';
import { UpdateCentreDepotDto } from './dto/update-centre-depot.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CreateCentreDepotDto } from './dto/create-centre-depot.dto';

@ApiTags('Infrastructures - Centres de Dépôt')
@ApiBearerAuth() // Indique que ces routes nécessitent un token JWT (sauf @Public)
@Controller('centre-depot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CentreDepotController {
  constructor(private readonly service: CentreDepotService) {}

  @Post()
  @Permissions('creer_centre_depot')
  @ApiOperation({ summary: 'Créer un nouveau centre de dépôt' })
  @ApiResponse({ status: 201, description: 'Le centre de dépôt a été créé avec succès.' })
  @ApiResponse({ status: 403, description: 'Interdit - Permissions insuffisantes.' })
  create(@Body() dto: CreateCentreDepotDto) {
    return this.service.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister tous les centres de dépôt' })
  @ApiResponse({ status: 200, description: 'Liste des centres récupérée.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Récupérer un centre de dépôt par son ID' })
  @ApiParam({ name: 'id', description: 'ID unique du centre de dépôt' })
  @ApiResponse({ status: 200, description: 'Détails du centre trouvés.' })
  @ApiResponse({ status: 404, description: 'Centre de dépôt non trouvé.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_centre_depot')
  @ApiOperation({ summary: 'Modifier les informations d\'un centre de dépôt' })
  @ApiParam({ name: 'id', description: 'ID du centre à modifier' })
  update(@Param('id') id: string, @Body() dto: UpdateCentreDepotDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_centre_depot')
  @ApiOperation({ summary: 'Supprimer un centre de dépôt' })
  @ApiParam({ name: 'id', description: 'ID du centre à supprimer' })
  @ApiResponse({ status: 200, description: 'Centre supprimé avec succès.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}