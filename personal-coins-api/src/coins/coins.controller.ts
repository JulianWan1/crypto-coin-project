import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CoinsService } from './coins.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Coin } from 'src/entities/coin.entity';
import { CreateCoinDto } from 'src/dto/create-coin.dto';
import { UpdateCoinDto } from 'src/dto/update-coin.dto';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @ApiOkResponse({ type: Coin, isArray: true })
  @ApiQuery({ name: 'coinName', required: false })
  @Get()
  async findAll(@Query('coinName') coinName: string): Promise<Coin[]> {
    // How to throw an error (400 Bad Request) when the query param key is mispelled/missing/invalid?

    return this.coinsService.findAll(coinName);
  }

  @ApiOkResponse({ type: Coin })
  @Get(':id')
  async find(@Param('id', ParseIntPipe) id: number): Promise<Coin> {
    return this.coinsService.find(id);
  }

  @ApiCreatedResponse({ type: Coin })
  @Post()
  async create(@Body() coin: CreateCoinDto): Promise<void> {
    try {
      await this.coinsService.create(coin);
    } catch (err) {
      console.error(err);
    }
  }

  @ApiCreatedResponse({ type: Coin })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() coin: UpdateCoinDto,
  ): Promise<number> {
    return this.coinsService.update(id, coin);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<string> {
    return this.coinsService.delete(id);
  }
}
