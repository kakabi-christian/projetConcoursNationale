import { Test, TestingModule } from '@nestjs/testing';
import { CentreExamenController } from './centre-examen.controller';

describe('CentreExamenController', () => {
  let controller: CentreExamenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentreExamenController],
    }).compile();

    controller = module.get<CentreExamenController>(CentreExamenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
