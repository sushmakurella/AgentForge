import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('agents')
  getAgents() {
    return this.appService.getAgents();
  }

  @Post('test-agent')
  testAgent(@Body() body: { prompt?: string }) {
    return this.appService.testAgent(body?.prompt);
  }
}
