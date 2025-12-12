import { Module } from '@nestjs/common';
import { EpreuveController } from './epreuve.controller';
import { EpreuveService } from './epreuve.service';

@Module({
  controllers: [EpreuveController],
  providers: [EpreuveService]
})
export class EpreuveModule {}
