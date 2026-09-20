import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { CryptoService } from '../common/crypto.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, CryptoService],
  exports: [AgentsService],
})
export class AgentsModule {}

