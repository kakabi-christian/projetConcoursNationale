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
import { BatimentService } from './batiment.service';
import { CreateBatimentDto } from './dto/create-batiment.dto';
import { UpdateBatimentDto } from './dto/update-batiment.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('batiment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BatimentController {
  constructor(private readonly service: BatimentService) {}

  @Post()
  @Permissions('creer_batiment')
  create(@Body() dto: CreateBatimentDto) {
    return this.service.create(dto);
  }

  // --- VERSION AVEC PAGINATION ---
  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Conversion sécurisée des chaînes de requête en nombres
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    
    return this.service.findAll(p, l);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_batiment')
  update(@Param('id') id: string, @Body() dto: UpdateBatimentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_batiment')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}