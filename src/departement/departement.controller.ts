import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('departements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartementController {
  constructor(private readonly departementService: DepartementService) {}

  @Post()
  @Permissions('creer_departement')
  create(@Body() dto: CreateDepartementDto) {
    return this.departementService.create(dto);
  }

  @Get()
  @Public() // Accessible sans jeton JWT
  findAll(
    @Query('page') page: string = '1', 
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    // On utilise le "+" pour transformer les chaînes en nombres (ex: "1" -> 1)
    return this.departementService.findAll(+page, +limit, search);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.departementService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_departement')
  update(@Param('id') id: string, @Body() dto: UpdateDepartementDto) {
    return this.departementService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_departement')
  remove(@Param('id') id: string) {
    return this.departementService.remove(id);
  }
}