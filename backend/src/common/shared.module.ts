import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [PrismaService, JwtStrategy, JwtAuthGuard, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [PrismaService, JwtStrategy, JwtAuthGuard, JwtModule],
})
export class SharedModule {}
