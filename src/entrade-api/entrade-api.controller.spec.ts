import { Test, TestingModule } from '@nestjs/testing';
import { EntradeApiController } from './entrade-api.controller';
import { EntradeApiService } from './entrade-api.service';

describe('EntradeApiController', () => {
  let controller: EntradeApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntradeApiController],
      providers: [EntradeApiService],
    }).compile();

    controller = module.get<EntradeApiController>(EntradeApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
