import { Test, TestingModule } from '@nestjs/testing';
import { EpreuveService } from './epreuve.service';

describe('EpreuveService', () => {
  let service: EpreuveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpreuveService],
    }).compile();

    service = module.get<EpreuveService>(EpreuveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
