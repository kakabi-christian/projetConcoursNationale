import { Test, TestingModule } from '@nestjs/testing';
import { SpecialiteService } from './specialite.service';

describe('SpecialiteService', () => {
  let service: SpecialiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecialiteService],
    }).compile();

    service = module.get<SpecialiteService>(SpecialiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
