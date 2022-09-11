import { Module } from '@nestjs/common';
import { CoinEventsController } from './coin-events.controller';
import { CoinEventsService } from './coin-events.service';

@Module({
  controllers: [CoinEventsController],
  providers: [CoinEventsService]
})
export class CoinEventsModule {}
