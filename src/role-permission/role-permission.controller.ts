import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post()
  create(@Body() dto: CreateRolePermissionDto) {
    return this.rolePermissionService.create(dto);
  }

  @Get()
  findAll() {
    return this.rolePermissionService.findAll();
  }

  @Get('role/:roleId')
  findByRole(@Param('roleId') roleId: string) {
    return this.rolePermissionService.findByRole(roleId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolePermissionService.remove(id);
  }
}
