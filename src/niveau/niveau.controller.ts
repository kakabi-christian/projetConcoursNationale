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
import { NiveauService } from './niveau.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('niveaux')
@UseGuards( PermissionsGuard)
export class NiveauController {
  constructor(private readonly niveauService: NiveauService) {}

  @Post()
  @Permissions('creer_niveau')
  create(@Body() createNiveauDto: CreateNiveauDto) {
    return this.niveauService.create(createNiveauDto);
  }

  /**
   * Récupère tous les niveaux avec pagination et recherche
   * Paramètres acceptés : ?page=1&limit=10&search=licence
   */
  @Get()
  @Public()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.niveauService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
    });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.niveauService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_niveau')
  update(@Param('id') id: string, @Body() updateNiveauDto: UpdateNiveauDto) {
    return this.niveauService.update(id, updateNiveauDto);
  }

  @Delete(':id')
  @Permissions('supprimer_niveau')
  remove(@Param('id') id: string) {
    return this.niveauService.remove(id);
  }
}