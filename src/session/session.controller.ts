import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Permissions('creer_session')
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.create(createSessionDto);
  }

  @Get()
  @Permissions('voir_sessions')
  findAll() {
    return this.sessionService.findAll();
  }

  @Get(':id')
  @Permissions('voir_session')
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_session')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionService.update(id, updateSessionDto);
  }

  @Delete(':id')
  @Permissions('supprimer_session')
  remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }
}
