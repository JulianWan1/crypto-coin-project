import { Module } from '@nestjs/common';
import { CoinsModule } from './coins/coins.module';

@Module({
  imports: [CoinsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
