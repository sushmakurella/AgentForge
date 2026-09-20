import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('tokens')
  async getTokenUsage(
    @Query('agentId') agentId?: string,
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.analyticsService.getTokenUsageStats({ agentId, userId, organizationId });
  }
}

