import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { InboundService } from '../services/inbound.service';
@Controller('inbound-orders')
export class InboundController {
  constructor(private readonly service: InboundService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() payload: any) { return this.service.create(payload); }
  @Put(':orderId/items/:itemId/shelf')
  shelfItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: { binLocationId: number }
  ) {
    return this.service.shelfItem(Number(orderId), Number(itemId), body.binLocationId);
  }
}
