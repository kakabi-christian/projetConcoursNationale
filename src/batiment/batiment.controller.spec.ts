import { Test, TestingModule } from '@nestjs/testing';
import { BatimentController } from './batiment.controller';

describe('BatimentController', () => {
  let controller: BatimentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatimentController],
    }).compile();

    controller = module.get<BatimentController>(BatimentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
