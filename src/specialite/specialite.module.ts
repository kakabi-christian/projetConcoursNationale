import { Module } from '@nestjs/common';
import { SpecialiteController } from './specialite.controller';
import { SpecialiteService } from './specialite.service';

@Module({
  controllers: [SpecialiteController],
  providers: [SpecialiteService]
})
export class SpecialiteModule {}
