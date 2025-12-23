import { Module } from '@nestjs/common';
import { FeedbacksService } from './feebacks.service';
import { FeedbacksController } from './feebacks.controller';

@Module({
  providers: [FeedbacksService],
  controllers: [FeedbacksController]
})
export class FeebacksModule {}
  