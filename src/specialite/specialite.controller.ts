import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SpecialiteService } from './specialite.service';
import { CreateSpecialiteDto } from './dto/create-specialite.dto';
import { UpdateSpecialiteDto } from './dto/update-specialite.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('specialites')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SpecialiteController {
  constructor(private readonly service: SpecialiteService) {}

  @Post()
  @Permissions('creer_specialite')
  create(@Body() dto: CreateSpecialiteDto) {
    return this.service.create(dto);
  }

  // --- VERSION AVEC PAGINATION ET RECHERCHE ---
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.service.findAll(p, l, search);
  }

  // ✅ NOUVELLE ROUTE : spécialités par filière (également paginée)
  @Get('filiere/:filiereId')
  @Public()
  findByFiliere(
    @Param('filiereId') filiereId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.service.findByFiliere(filiereId, p, l);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_specialite')
  update(@Param('id') id: string, @Body() dto: UpdateSpecialiteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_specialite')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}