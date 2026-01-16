import { Test, TestingModule } from '@nestjs/testing';
import { BatimentService } from './batiment.service';

describe('BatimentService', () => {
  let service: BatimentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BatimentService],
    }).compile();

    service = module.get<BatimentService>(BatimentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
