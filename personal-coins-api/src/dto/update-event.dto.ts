import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

// Some fields are permitted to be empty as there are possibilities they are not needed to be updated
export class UpdateEventDto {
  @ApiProperty() @IsNumber() @IsNotEmpty() readonly id: number; // main determining factor for event update
  @ApiProperty() @IsString() @IsNotEmpty() readonly coinName: string; // To add extra certainty that the event is associated with correct coin (will reference with coin id)
  @ApiProperty() @IsNumber() @IsIn([0,2]) @IsNotEmpty() readonly eventType: number; // needed to identify if buy or sell event
  @ApiProperty() @IsNumber() @IsPositive() @IsOptional() readonly buySellQuantity: number | null;
  @ApiProperty() @IsNumber() @IsPositive() @IsOptional() readonly marketPrice: number;
  @ApiProperty() @IsNumber() @IsOptional() readonly networkFee: number; // potentially negative
  @ApiProperty() @IsNumber() @IsOptional() readonly exchangePremium: number; // potentially negative
  @ApiProperty() @IsDateString() @IsOptional() readonly eventDate: Date;
}

// eventDate and buySellQuantity are critical when updates are made

// 1. Dealing with Buy Updates
// 1.1 If the buy event is between a DCA event and a sell event,
// - Check eventDate
//   Ensure that it is within the range of DCA event and sell event (before sell event date & time)
// - Check buySellQuantity
//   Ensure it will not cause the sell quantity > the bought amount in the range
//   Ensure it will not cause the total sell quantity > total bought amount
// 1.2 If no sell ahead of it
// - Ensure it is not before the DCA that it is under
// 1.2 buySellQuantity
// If the buy event's date is updated to be ahead of the closest sell event date proceeding it 
//   ensure that the cummulative amount bought will still be >= sell event's quantity

// 2. Dealing with Sell Updates
// -quantity being increased
// Range of events
// - lastDCAEvent till sell event date

