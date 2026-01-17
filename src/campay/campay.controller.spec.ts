import { Test, TestingModule } from '@nestjs/testing';
import { CampayController } from './campay.controller';

describe('CampayController', () => {
  let controller: CampayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampayController],
    }).compile();

    controller = module.get<CampayController>(CampayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
