// data transfer object: 
// - ensures data being sent/received complies to a set format
// - classes or interfaces can be used to create DTO but classes are recommended

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateNewEventDto {
  @ApiProperty() @IsString() @IsNotEmpty() readonly coinName: string;
  @ApiProperty() @IsString() @IsNotEmpty() readonly coinCode: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() readonly buySellQuantity: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() readonly marketPrice: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() readonly networkFee: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() readonly exchangePremium: number;
  @ApiProperty() @IsDateString() @IsNotEmpty() readonly buySellDate: Date;
}
