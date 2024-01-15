import { Module } from '@nestjs/common';
import { EntradeAPIService } from './entrade-api.service';
import { EntradeAPIController } from './entrade-api.controller';

@Module({
  controllers: [EntradeAPIController],
  providers: [EntradeAPIService],
})
export class EntradeApiModule {}
