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
import { EpreuveService } from './epreuve.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { UpdateEpreuveDto } from './dto/update-epreuve.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('epreuves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EpreuveController {
  constructor(private readonly epreuveService: EpreuveService) {}

  @Post()
  @Permissions('creer_epreuve')
  create(@Body() createEpreuveDto: CreateEpreuveDto) {
    return this.epreuveService.create(createEpreuveDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.epreuveService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.epreuveService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_epreuve')
  update(@Param('id') id: string, @Body() updateEpreuveDto: UpdateEpreuveDto) {
    return this.epreuveService.update(id, updateEpreuveDto);
  }

  @Delete(':id')
  @Permissions('supprimer_epreuve')
  remove(@Param('id') id: string) {
    return this.epreuveService.remove(id);
  }

  // 🔹 NOUVELLE ROUTE : épreuves par spécialité
  @Get('specialite/:specialiteId')
  @Public()
  findBySpecialite(@Param('specialiteId') specialiteId: string) {
    return this.epreuveService.findBySpecialite(specialiteId);
  }
}
