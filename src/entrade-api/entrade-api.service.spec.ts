import { Test, TestingModule } from '@nestjs/testing';
import { EntradeApiService } from './entrade-api.service';

describe('EntradeApiService', () => {
  let service: EntradeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntradeApiService],
    }).compile();

    service = module.get<EntradeApiService>(EntradeApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
