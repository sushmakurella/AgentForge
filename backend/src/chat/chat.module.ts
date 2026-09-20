import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ToolsModule } from '../tools/tools.module';
import { CryptoService } from '../common/crypto.service';

@Module({
  imports: [ToolsModule],
  controllers: [ChatController],
  providers: [ChatService, CryptoService],
  exports: [ChatService],
})
export class ChatModule {}

