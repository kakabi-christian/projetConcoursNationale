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
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { AnneeService } from './annee-academique.service';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('annees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnneeController {
  constructor(private readonly anneeService: AnneeService) {}

  @Post()
  @Permissions("creer_annee_academique")
  create(@Body() createAnneeDto: CreateAnneeDto) {
    return this.anneeService.create(createAnneeDto);
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ---
  @Get()
  @Public()
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