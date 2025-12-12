import { Test, TestingModule } from '@nestjs/testing';
import { ConcoursService } from './concours.service';

describe('ConcoursService', () => {
  let service: ConcoursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConcoursService],
    }).compile();

    service = module.get<ConcoursService>(ConcoursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
