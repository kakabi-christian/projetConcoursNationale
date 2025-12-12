import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConcoursService } from './concours.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { UpdateConcoursDto } from './update-concours.dto';
import { Public } from 'src/auth/decorators/public.decorator';
@Controller('concours')
@UseGuards(JwtAuthGuard, PermissionsGuard) // sécurise toutes les routes avec JWT + permissions
export class ConcoursController {
  constructor(private readonly concoursService: ConcoursService) {}

  // Créer un concours
  @Post()
  @Permissions('creer_concours')
  create(@Body() createConcoursDto: CreateConcoursDto) {
    return this.concoursService.create(createConcoursDto);
  }

  // Récupérer tous les concours
  @Get()
  @Public()
  findAll() {
    return this.concoursService.findAll();
  }

  // Récupérer un concours par ID
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.concoursService.findOne(id);
  }

  // Mettre à jour un concours
  @Patch(':id')
  @Permissions('modifier_concours')
  update(
    @Param('id') id: string,
    @Body() updateConcoursDto: UpdateConcoursDto,
  ) {
    return this.concoursService.update(id, updateConcoursDto);
  }

  // Supprimer un concours
  @Delete(':id')
  @Permissions('supprimer_concours')
  remove(@Param('id') id: string) {
    return this.concoursService.remove(id);
  }
}
