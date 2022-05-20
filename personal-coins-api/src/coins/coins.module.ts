import { Module } from '@nestjs/common';
import GeneralBuyEvent from 'src/general-api-functions/general-buy-event';
import GeneralPortfolioUpdate from 'src/general-api-functions/general-portfolio-update';
import { CoinsController } from './coins.controller';
import { CoinsNewService } from './coins-new-coin.service';
import { CoinsSellService } from './coins-sell.service';
import { CoinsBuyService } from './coins-buy.service';
import GeneralSellEvent from 'src/general-api-functions/general-sell-event';
import GeneralEventLogUpdate from 'src/general-api-functions/general-event-log-update';
import GeneralDCADefiningEvent from 'src/general-api-functions/general-dca-defining-event';

@Module({
  controllers: [CoinsController],
  providers: [
    CoinsNewService,
    CoinsSellService,
    CoinsBuyService,
    GeneralBuyEvent,
    GeneralSellEvent,
    GeneralDCADefiningEvent,
    GeneralEventLogUpdate,
    GeneralPortfolioUpdate,
  ]
})
export class CoinsModule {}
