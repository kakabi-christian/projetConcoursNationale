import { Test, TestingModule } from '@nestjs/testing';
import { FeebacksController } from './feebacks.controller';

describe('FeebacksController', () => {
  let controller: FeebacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeebacksController],
    }).compile();

    controller = module.get<FeebacksController>(FeebacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
