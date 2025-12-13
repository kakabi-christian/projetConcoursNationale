import { Test, TestingModule } from '@nestjs/testing';
import { PieceDossierController } from './piece-dossier.controller';

describe('PieceDossierController', () => {
  let controller: PieceDossierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PieceDossierController],
    }).compile();

    controller = module.get<PieceDossierController>(PieceDossierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
