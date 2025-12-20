import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam 
} from '@nestjs/swagger'; // Imports Swagger
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { AnneeService } from './annee-academique.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Années Académiques') // Catégorie dans Swagger
@ApiBearerAuth() // Indique que le token JWT est requis (sauf pour @Public)
@Controller('annees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnneeController {
  constructor(private readonly anneeService: AnneeService) {}

  @Post()
  @Permissions("creer_annee_academique")
  @ApiOperation({ summary: 'Créer une nouvelle année académique' })
  @ApiResponse({ status: 201, description: 'Création réussie.', type: CreateAnneeDto })
  @ApiResponse({ status: 403, description: 'Interdit - Permission manquante.' })
  create(@Body() createAnneeDto: CreateAnneeDto) {
    return this.anneeService.create(createAnneeDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister toutes les années (Pagination incluse)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    
    return this.anneeService.findAll(p, l, search);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtenir une année par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'année académique' })
  findOne(@Param('id') id: string) {
    return this.anneeService.findOne(id);
  }

  @Patch(':id')
  @Permissions("modifier_annee_academique")
  @ApiOperation({ summary: 'Mettre à jour une année' })
  @ApiParam({ name: 'id', description: 'ID de l\'année à modifier' })
  @ApiResponse({ status: 200, description: 'Mise à jour réussie.' })
  update(@Param('id') id: string, @Body() updateAnneeDto: UpdateAnneeDto) {
    return this.anneeService.update(id, updateAnneeDto);
  }

  @Delete(':id')
  @Permissions("supprimer_annee_academique")
  @ApiOperation({ summary: 'Supprimer une année' })
  @ApiParam({ name: 'id', description: 'ID de l\'année à supprimer' })
  @ApiResponse({ status: 200, description: 'Suppression réussie.' })
  remove(@Param('id') id: string) {
    return this.anneeService.remove(id);
  }
}