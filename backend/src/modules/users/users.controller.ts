import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/address.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.users.getProfile(userId);
  }

  @Get('me/addresses')
  addresses(@CurrentUser('sub') userId: string) {
    return this.users.listAddresses(userId);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser('sub') userId: string, @Body() dto: CreateAddressDto) {
    return this.users.createAddress(userId, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.users.deleteAddress(userId, id);
  }
}
