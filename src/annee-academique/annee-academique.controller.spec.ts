import { Test, TestingModule } from '@nestjs/testing';
import { AnneeAcademiqueController } from './annee-academique.controller';

describe('AnneeAcademiqueController', () => {
  let controller: AnneeAcademiqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnneeAcademiqueController],
    }).compile();

    controller = module.get<AnneeAcademiqueController>(AnneeAcademiqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
