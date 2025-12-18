import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ConcoursService } from './concours.service';
import { CreateConcoursDto } from './dto/create-concours.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { UpdateConcoursDto } from './dto/update-concours.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('concours')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConcoursController {
  constructor(private readonly concoursService: ConcoursService) {}

  @Post()
  @Permissions('creer_concours')
  create(@Body() createConcoursDto: CreateConcoursDto) {
    return this.concoursService.create(createConcoursDto);
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
    
    return this.concoursService.findAll(p, l, search);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.concoursService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_concours')
  update(
    @Param('id') id: string,
    @Body() updateConcoursDto: UpdateConcoursDto,
  ) {
    return this.concoursService.update(id, updateConcoursDto);
  }

  @Delete(':id')
  @Permissions('supprimer_concours')
  remove(@Param('id') id: string) {
    return this.concoursService.remove(id);
  }
}