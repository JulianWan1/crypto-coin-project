import { Module } from '@nestjs/common';
import GeneralBuyEvent from 'src/general-api-functions/general-buy-event';
import GeneralPortfolioUpdate from 'src/general-api-functions/general-portfolio-update';
import { CoinsController } from './coins.controller';
import { CoinsNewService } from './coins-new-coin.service';
@Module({
  controllers: [CoinsController],
  providers: [
    CoinsNewService, 
    GeneralBuyEvent,
    GeneralPortfolioUpdate,
  ]
})
export class CoinsModule {}
