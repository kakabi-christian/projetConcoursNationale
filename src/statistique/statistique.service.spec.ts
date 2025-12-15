import { Test, TestingModule } from '@nestjs/testing';
import { StatistiqueService } from './statistique.service';

describe('StatistiqueService', () => {
  let service: StatistiqueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatistiqueService],
    }).compile();

    service = module.get<StatistiqueService>(StatistiqueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
