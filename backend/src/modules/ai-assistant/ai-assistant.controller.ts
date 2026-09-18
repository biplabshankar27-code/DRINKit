import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiAssistantService } from './ai-assistant.service';

@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AiAssistantController {
  constructor(private readonly assistant: AiAssistantService) {}

  @Post('chat')
  chat(@CurrentUser('sub') userId: string, @Body() body: { message: string }) {
    return this.assistant.chat(userId, body.message);
  }

  @Get('chat/history')
  history(@CurrentUser('sub') userId: string) {
    return this.assistant.getHistory(userId);
  }

  @Delete('chat/history')
  clearHistory(@CurrentUser('sub') userId: string) {
    return this.assistant.clearHistory(userId);
  }
}
