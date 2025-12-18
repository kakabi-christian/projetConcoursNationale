import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { CentreExamenService } from './centre-examen.service';
import { CreateCentreExamenDto } from './dto/create-centre-examen.dto';
import { UpdateCentreExamenDto } from './dto/update-centre-examen.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('centre-examen')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CentreExamenController {
  constructor(private readonly service: CentreExamenService) {}

  @Post()
  @Permissions('creer_centre_examen')
  create(@Body() dto: CreateCentreExamenDto) {
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
    // Conversion des strings en nombres pour le service
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    
    return this.service.findAll(p, l, search);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_centre_examen')
  update(@Param('id') id: string, @Body() dto: UpdateCentreExamenDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_centre_examen')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}