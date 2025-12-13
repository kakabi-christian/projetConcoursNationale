import { Test, TestingModule } from '@nestjs/testing';
import { CentreExamenService } from './centre-examen.service';

describe('CentreExamenService', () => {
  let service: CentreExamenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CentreExamenService],
    }).compile();

    service = module.get<CentreExamenService>(CentreExamenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
