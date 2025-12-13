import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CentreDepotService } from './centre-depot.service';
import { UpdateCentreDepotDto } from './dto/update-centre-depot.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CreateCentreDepotDto } from './dto/create-centre-depot.dto';

@Controller('centre-depot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CentreDepotController {
  constructor(private readonly service: CentreDepotService) {}

  @Post()
  @Permissions('creer_centre_depot')
  create(@Body() dto: CreateCentreDepotDto) {
    return this.service.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_centre_depot')
  update(@Param('id') id: string, @Body() dto: UpdateCentreDepotDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_centre_depot')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
