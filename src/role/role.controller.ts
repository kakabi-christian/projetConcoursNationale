import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'; // Ajout de Query
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { UserType } from '@prisma/client';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('creer_role')
  @UseGuards(PermissionsGuard)
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  // --- MODIFIÉ POUR LA PAGINATION ---
  @Get()
  findAll(
    @Query('page') page?: string, 
    @Query('limit') limit?: string
  ) {
    // Le "+" convertit la string en number
    // On passe les valeurs au service
    return this.roleService.findAll(
      page ? +page : 1, 
      limit ? +limit : 10
    );
  }
  // ----------------------------------

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  // Route pour voir un rôle avec le détail de ses permissions
  @Get(':id/details')
  findOneWithPermissions(@Param('id') id: string) {
    return this.roleService.findOneWithPermissions(id);
  }

  @Patch(':id')
  @Permissions('modifier_role')
  @UseGuards(PermissionsGuard)  
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('supprimer_role')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Patch(':id/permissions')
  @Permissions(UserType.SUPERADMIN)
  @Permissions('assigner_permissions_role')
  @UseGuards(PermissionsGuard)
  async assignPermissions(
    @Param('id') id: string,
    @Body('permissionIds') permissionIds: string[]
  ) {
    return this.roleService.assignPermissions(id, permissionIds);
  }
}