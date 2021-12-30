import { Module } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';
import { CreateCoinDao } from 'src/dao/create-coin.dao';
import { GetCoinDao } from 'src/dao/get-coin.dao';
import { CoinDeserializer, CoinSerializer } from 'src/entities/coin.entity';
import { UpdateCoinDao } from 'src/dao/update-coin.dao';
import { DeleteCoinDao } from 'src/dao/delete-coin.dao';

@Module({
  providers: [
    CoinsService,
    CreateCoinDao,
    GetCoinDao,
    UpdateCoinDao,
    DeleteCoinDao,
    CoinDeserializer,
    CoinSerializer,
  ],
  controllers: [CoinsController],
})
export class CoinsModule {}
