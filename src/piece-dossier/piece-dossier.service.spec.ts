import { Test, TestingModule } from '@nestjs/testing';
import { PieceDossierService } from './piece-dossier.service';

describe('PieceDossierService', () => {
  let service: PieceDossierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PieceDossierService],
    }).compile();

    service = module.get<PieceDossierService>(PieceDossierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
