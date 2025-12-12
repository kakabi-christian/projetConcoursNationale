import { Test, TestingModule } from '@nestjs/testing';
import { EpreuveController } from './epreuve.controller';

describe('EpreuveController', () => {
  let controller: EpreuveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpreuveController],
    }).compile();

    controller = module.get<EpreuveController>(EpreuveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
