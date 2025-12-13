import { Test, TestingModule } from '@nestjs/testing';
import { CentreDepotService } from './centre-depot.service';

describe('CentreDepotService', () => {
  let service: CentreDepotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CentreDepotService],
    }).compile();

    service = module.get<CentreDepotService>(CentreDepotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
