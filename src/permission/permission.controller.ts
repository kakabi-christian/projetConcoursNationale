import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'; // Query ajouté ici
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ---
  @Get()
  findAll(
    @Query('page') page?: string, 
    @Query('limit') limit?: string
  ) {
    // On convertit les strings en nombres avec le "+"
    // On définit des valeurs par défaut (1 et 10) au cas où elles sont absentes
    const pageNumber = page ? +page : 1;
    const limitNumber = limit ? +limit : 10;
    
    return this.permissionService.findAll(pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }
}