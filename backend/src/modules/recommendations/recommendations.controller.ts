import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recs: RecommendationsService) {}

  @Get('for-you')
  forYou(@CurrentUser('sub') userId: string, @Query('limit') limit?: string) {
    return this.recs.forYou(userId, Number(limit) || 10);
  }

  @Get('similar/:productId')
  similar(@Param('productId') productId: string, @Query('limit') limit?: string) {
    return this.recs.similar(productId, Number(limit) || 6);
  }

  @Get('popular')
  popular(@Query('limit') limit?: string) {
    return this.recs.popular(Number(limit) || 10);
  }
}
