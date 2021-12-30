import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCoinDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  readonly id: number;
  @ApiProperty() @IsString() readonly coinName: string;
  @ApiProperty() @IsNumber() readonly currentAmountOwned: number;
  @ApiProperty() @IsNumber() readonly currentCoinMarketPrice: number;
  @ApiProperty() @IsNumber() readonly dollarCostAverage: number;
  @ApiProperty() @IsNumber() readonly dollarSoldAverage: number; // may need a previous dollarCostAverage to help calculate realisedProfitLossPercentage?
  @ApiProperty() @IsNumber() readonly totalBought: number;
  @ApiProperty() @IsNumber() readonly totalSold: number;
  @ApiProperty() @IsNumber() readonly unrealisedProfitLossPercentage: number;
  @ApiProperty() @IsNumber() readonly realisedProfitLossPercentage: number;
  @ApiProperty() @IsNumber() readonly lastBoughtAmount: number;
  @ApiProperty() @IsString() readonly lastBoughtDate: string;
  @ApiProperty() @IsNumber() readonly lastSoldAmount: number;
  @ApiProperty() @IsString() readonly lastSoldDate: string;
}
