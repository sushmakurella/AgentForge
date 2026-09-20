import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    // Verify Neon database connectivity
    let dbStatus = 'connected';
    let agentCount = 0;
    try {
      agentCount = await this.prisma.agent.count();
      
      // If database is empty, seed a sample default agent
      if (agentCount === 0) {
        await this.prisma.agent.create({
          data: {
            name: 'Customer Support Pro',
            slug: 'customer-support-pro',
            description: 'Friendly, intelligent agent for handling customer inquiries and FAQs.',
            provider: 'google',
            model: 'gemini-3.6-flash',
            systemPrompt: 'You are an empathetic, professional customer support agent for our platform.',
            temperature: 0.7,
            maxTokens: 2048,
            isPublic: true,
            status: 'PUBLISHED',
          },
        });
        agentCount = 1;
      }
    } catch (error: any) {
      dbStatus = `error: ${error.message}`;
    }

    return {
      status: 'ok',
      service: 'Agent Marketplace API',
      database: dbStatus,
      totalAgentsInDb: agentCount,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getAgents() {
    return this.prisma.agent.findMany({
      include: {
        tools: {
          include: {
            tool: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async testAgent(prompt?: string) {
    const userPrompt = prompt || 'Hello';
    const firstAgent = await this.prisma.agent.findFirst();

    return {
      success: true,
      agent: firstAgent?.name || 'Default Marketplace Agent',
      model: firstAgent?.model || 'gemini-1.5-flash',
      provider: firstAgent?.provider || 'google',
      systemPrompt: firstAgent?.systemPrompt,
      receivedPrompt: userPrompt,
      reply: `[Agent Response from ${firstAgent?.name || 'Agent'}]: I received "${userPrompt}". Powered by ${firstAgent?.model || 'AI Model'} & stored live in Neon PostgreSQL!`,
      timestamp: new Date().toISOString(),
    };
  }
}
