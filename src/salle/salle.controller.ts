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
import { SalleService } from './salle.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('salle')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalleController {
  constructor(private readonly service: SalleService) {}

  @Post()
  @Permissions('creer_salle')
  create(@Body() dto: CreateSalleDto) {
    // Rappel : le codeClasse est généré automatiquement dans le service
    return this.service.create(dto);
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
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
  @Permissions('modifier_salle')
  update(@Param('id') id: string, @Body() dto: UpdateSalleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_salle')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  @Get('list/batiments')
  @Public() // Ou avec permission selon ton choix
  async getBatimentsForSelect() {
    return this.service.getBatimentsForSelect();
  }
}