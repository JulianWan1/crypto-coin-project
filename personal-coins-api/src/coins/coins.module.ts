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
import { CoinsEventUpdateService } from './coins-event-update.service';
import { CoinsEventDeleteService } from './coins-event-delete.service';
import { CoinsDeleteService } from './coins-delete.service';
import { CoinsGetService } from './coins-get.service';

@Module({
  controllers: [CoinsController],
  providers: [
    CoinsNewService,
    CoinsSellService,
    CoinsBuyService,
    CoinsEventUpdateService,
    CoinsEventDeleteService,
    CoinsDeleteService,
    CoinsGetService,
    GeneralBuyEvent,
    GeneralSellEvent,
    GeneralDCADefiningEvent,
    GeneralEventLogUpdate,
    GeneralPortfolioUpdate,
  ]
})
export class CoinsModule {}
