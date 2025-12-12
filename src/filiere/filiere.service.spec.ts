import { Test, TestingModule } from '@nestjs/testing';
import { FiliereService } from './filiere.service';

describe('FiliereService', () => {
  let service: FiliereService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FiliereService],
    }).compile();

    service = module.get<FiliereService>(FiliereService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
