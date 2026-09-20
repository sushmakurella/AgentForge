import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ToolsModule } from './tools/tools.module';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OrganizationModule } from './organization/organization.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, ToolsModule, AgentsModule, ChatModule, AnalyticsModule, OrganizationModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
