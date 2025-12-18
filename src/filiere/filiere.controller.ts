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
import { FiliereService } from './filiere.service';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('filieres')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FiliereController {
  constructor(private readonly filiereService: FiliereService) {}

  // 🔹 Créer une filière
  @Post()
  @Permissions('creer_filiere')
  create(@Body() createFiliereDto: CreateFiliereDto) {
    return this.filiereService.create(createFiliereDto);
  }

  // 🔹 Récupérer toutes les filières avec pagination et recherche
  // URL exemple: /filieres?page=1&limit=10&search=informatique
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.filiereService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }

  // 🔹 Récupérer une filière par ID
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.filiereService.findOne(id);
  }

  // 🔹 Mettre à jour une filière
  @Patch(':id')
  @Permissions('modifier_filiere')
  update(@Param('id') id: string, @Body() updateFiliereDto: UpdateFiliereDto) {
    return this.filiereService.update(id, updateFiliereDto);
  }

  // 🔹 Supprimer une filière
  @Delete(':id')
  @Permissions('supprimer_filiere')
  remove(@Param('id') id: string) {
    return this.filiereService.remove(id);
  }

  // 🔹 Récupérer les filières d'un département avec pagination
  // URL exemple: /filieres/departement/ID_DEPT?page=1&limit=5
  @Get('departement/:id')
  @Public()
  findByDepartement(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.filiereService.findByDepartement(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}