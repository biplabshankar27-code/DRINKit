import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt', session: false }), JwtModule],
  providers: [PrismaService, JwtStrategy, JwtAuthGuard, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [PrismaService, JwtStrategy, JwtAuthGuard, PassportModule, JwtModule],
})
export class SharedModule {}
