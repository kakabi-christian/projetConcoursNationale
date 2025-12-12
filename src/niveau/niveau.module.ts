import { Module } from '@nestjs/common';
import { NiveauController } from './niveau.controller';
import { NiveauService } from './niveau.service';

@Module({
  controllers: [NiveauController],
  providers: [NiveauService]
})
export class NiveauModule {}
