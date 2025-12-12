import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { AnneeService } from './annee-academique.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator'; // <- ici

@Controller('annees')
@UseGuards(JwtAuthGuard, PermissionsGuard) // ajoute JwtAuthGuard pour sécuriser avec JWT
export class AnneeController {
  constructor(private readonly anneeService: AnneeService) {}

  @Post()
  @Permissions("creer_annee_academique")
  create(@Body() createAnneeDto: CreateAnneeDto) {
    return this.anneeService.create(createAnneeDto);
  }

  @Get()
  @Permissions("voir_annees_academiques")
  findAll() {
    return this.anneeService.findAll();
  }

  @Get(':id')
  @Permissions("voir_annee_academique")
  findOne(@Param('id') id: string) {
    return this.anneeService.findOne(id);
  }

  @Patch(':id')
  @Permissions("modifier_annee_academique")
  update(@Param('id') id: string, @Body() updateAnneeDto: UpdateAnneeDto) {
    return this.anneeService.update(id, updateAnneeDto);
  }

  @Delete(':id')
  @Permissions("supprimer_annee_academique")
  remove(@Param('id') id: string) {
    return this.anneeService.remove(id);
  }
}
