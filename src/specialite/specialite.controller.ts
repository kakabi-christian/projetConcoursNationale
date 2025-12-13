// src/specialite/specialite.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
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

  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  // ✅ NOUVELLE ROUTE : spécialités par filière
  @Get('filiere/:filiereId')
  @Public()
  findByFiliere(@Param('filiereId') filiereId: string) {
    return this.service.findByFiliere(filiereId);
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
