import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntradeApiModule } from './entrade-api/entrade-api.module';
import 'dotenv/config';
@Module({
  imports: [EntradeApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
