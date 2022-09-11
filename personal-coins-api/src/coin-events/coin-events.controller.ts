import { Controller, Post } from '@nestjs/common';
import { CoinEventsService } from './coin-events.service';

@Controller('coin-events')
export class CoinEventsController {
  constructor(private readonly coinEventsService:CoinEventsService){}

  @Post()
  async createBuyEvent(): Promise<void>{
    
  }

  @Post()
  async createSellEvent(): Promise<void>{
    
  }

}
