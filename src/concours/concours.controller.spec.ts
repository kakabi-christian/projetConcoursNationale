import { Test, TestingModule } from '@nestjs/testing';
import { ConcoursController } from './concours.controller';

describe('ConcoursController', () => {
  let controller: ConcoursController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcoursController],
    }).compile();

    controller = module.get<ConcoursController>(ConcoursController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
