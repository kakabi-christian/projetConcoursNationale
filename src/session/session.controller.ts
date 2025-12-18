import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Permissions('creer_session')
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.create(createSessionDto);
  }

  // --- VERSION MISE À JOUR AVEC PAGINATION ---
  @Get()
  @Public() // Rendu public pour permettre la sélection au front sans être forcément admin
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    
    return this.sessionService.findAll(p, l, search);
  }

  @Get(':id')
  @Public()
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