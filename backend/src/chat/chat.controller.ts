import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  chat(@Body() chatRequestDto: ChatRequestDto) {
    return this.chatService.executeChat(chatRequestDto);
  }

  @Get('history/:sessionId')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionHistory(sessionId);
  }
}

