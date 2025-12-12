import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  create(@Body() dto: CreateUserRoleDto) {
    return this.userRoleService.create(dto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userRoleService.findByUser(userId);
  }

  @Get('role/:roleId')
  findByRole(@Param('roleId') roleId: string) {
    return this.userRoleService.findByRole(roleId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userRoleService.remove(id);
  }
}
