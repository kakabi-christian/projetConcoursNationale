import { Test, TestingModule } from '@nestjs/testing';
import { FiliereController } from './filiere.controller';

describe('FiliereController', () => {
  let controller: FiliereController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiliereController],
    }).compile();

    controller = module.get<FiliereController>(FiliereController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
