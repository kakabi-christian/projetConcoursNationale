import { Test, TestingModule } from '@nestjs/testing';
import { CampayService } from './campay.service';

describe('CampayService', () => {
  let service: CampayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampayService],
    }).compile();

    service = module.get<CampayService>(CampayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
