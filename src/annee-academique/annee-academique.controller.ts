import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { AnneeService } from './annee-academique.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator'; // <- ajouté

@Controller('annees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnneeController {
  constructor(private readonly anneeService: AnneeService) {}

  @Post()
  @Permissions("creer_annee_academique")
  create(@Body() createAnneeDto: CreateAnneeDto) {
    return this.anneeService.create(createAnneeDto);
  }

  @Get()
  @Public() // <-- rendu public pour le front
  findAll() {
    return this.anneeService.findAll();
  }

  @Get(':id')
  @Public() // <-- rendu public pour le front
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
