// src/piecedossier/piecedossier.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreatePieceDossierDto } from './dto/create-piecedossier.dto';
import { UpdatePieceDossierDto } from './dto/update-piecedossier.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { PieceDossierService } from './piece-dossier.service';

@Controller('pieces-dossier')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PieceDossierController {
  constructor(private readonly service: PieceDossierService) {}

  @Post()
  @Permissions('creer_piece_dossier')
  create(@Body() dto: CreatePieceDossierDto) {
    return this.service.create(dto);
  }

  @Get()
  @Public() // rendu public
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Public() // rendu public
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_piece_dossier')
  update(@Param('id') id: string, @Body() dto: UpdatePieceDossierDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_piece_dossier')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
