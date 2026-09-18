import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

class CreatePaymentDto {
  @IsString() @MinLength(6)
  orderId!: string;
}

class VerifyPaymentDto {
  @IsString() @MinLength(6)
  orderId!: string;

  @IsString() @MinLength(4)
  reference!: string;

  @IsBoolean()
  success!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-payment')
  create(@CurrentUser('sub') userId: string, @Body() dto: CreatePaymentDto) {
    return this.payments.createPayment(userId, dto.orderId);
  }

  @Post('verify')
  verify(@CurrentUser('sub') userId: string, @Body() dto: VerifyPaymentDto) {
    if (dto.success && !dto.reference.includes(dto.orderId)) {
      throw new BadRequestException('Invalid payment reference');
    }
    return this.payments.verifyPayment(userId, dto.orderId, dto.reference, dto.success);
  }
}
