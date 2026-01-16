import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchCandidatesDto } from './dto/dispach-candidat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

@Controller('dispatch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  /**
   * Lance l'affectation automatique des candidats dans les salles.
   * Permission requise : 'gerer_dispatching' (à adapter selon tes permissions en base)
   */
  @Post('run')
  @Permissions('gerer_dispatching')
  async runDispatch(@Body() dto: DispatchCandidatesDto) {
    return this.dispatchService.dispatchCandidates(dto);
  }
}