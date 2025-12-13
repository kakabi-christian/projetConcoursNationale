import { Test, TestingModule } from '@nestjs/testing';
import { CentreDepotController } from './centre-depot.controller';

describe('CentreDepotController', () => {
  let controller: CentreDepotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentreDepotController],
    }).compile();

    controller = module.get<CentreDepotController>(CentreDepotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
