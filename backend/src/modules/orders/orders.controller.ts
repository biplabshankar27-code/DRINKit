import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService, ORDER_STATUSES } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

class AdminStatusDto {
  @IsString()
  status!: string;

  @IsOptional() @IsString() @MaxLength(64)
  deliveryAgent?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.orders.create(userId, dto);
  }

  @Get()
  list(@CurrentUser('sub') userId: string) {
    return this.orders.listForUser(userId);
  }

  @Get(':id')
  get(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.orders.get(userId, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.orders.cancel(userId, id);
  }

  // simplified admin endpoint for MVP order management
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: AdminStatusDto) {
    const status = ORDER_STATUSES.find((s) => s === dto.status);
    if (!status) {
      throw new Error(`Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
    }
    return this.orders.updateStatus(id, status, dto.deliveryAgent);
  }
}
