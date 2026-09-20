import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { ToolRunnerService } from './tool-runner.service';
import { CryptoService } from '../common/crypto.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService, ToolRunnerService, CryptoService],
  exports: [ToolsService, ToolRunnerService, CryptoService],
})
export class ToolsModule {}

