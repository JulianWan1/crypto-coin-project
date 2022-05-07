import { Module } from '@nestjs/common';
import { CoinsModule } from './coins/coins.module';
import { CoinEventsModule } from './coin-events/coin-events.module';

@Module({
  imports: [CoinsModule, CoinEventsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
