import { Test, TestingModule } from '@nestjs/testing';
import { FeedbacksService } from './feebacks.service';
describe('FeebacksService', () => {
  let service: FeedbacksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbacksService],
    }).compile();

    service = module.get<FeedbacksService>(FeedbacksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
