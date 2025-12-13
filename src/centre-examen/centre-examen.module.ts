import { Module } from '@nestjs/common';
import { CentreExamenController } from './centre-examen.controller';
import { CentreExamenService } from './centre-examen.service';

@Module({
  controllers: [CentreExamenController],
  providers: [CentreExamenService]
})
export class CentreExamenModule {}
