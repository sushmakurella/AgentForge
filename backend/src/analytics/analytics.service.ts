import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTokenUsageStats(query?: { agentId?: string; userId?: string; organizationId?: string }) {
    const whereClause: any = {};
    if (query?.agentId) {
      whereClause.agentId = query.agentId;
    }
    if (query?.userId) {
      whereClause.userId = query.userId;
    }

    // Fetch all matching token usages with agent info
    const usages = await this.prisma.tokenUsage.findMany({
      where: whereClause,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            model: true,
            provider: true,
            creatorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCost = 0;

    const agentMap = new Map<string, any>();
    const modelMap = new Map<string, any>();

    for (const u of usages) {
      totalTokens += u.totalTokens;
      promptTokens += u.promptTokens;
      completionTokens += u.completionTokens;
      totalCost += u.costEstimate;

      // Group by Agent
      const agentId = u.agentId;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agentId: u.agent.id,
          agentName: u.agent.name,
          model: u.model,
          provider: u.provider,
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          interactionsCount: 0,
        });
      }
      const a = agentMap.get(agentId);
      a.totalTokens += u.totalTokens;
      a.promptTokens += u.promptTokens;
      a.completionTokens += u.completionTokens;
      a.totalCost += u.costEstimate;
      a.interactionsCount += 1;

      // Group by Model
      const modelKey = `${u.provider}:${u.model}`;
      if (!modelMap.has(modelKey)) {
        modelMap.set(modelKey, {
          provider: u.provider,
          model: u.model,
          totalTokens: 0,
          totalCost: 0,
          interactionsCount: 0,
        });
      }
      const m = modelMap.get(modelKey);
      m.totalTokens += u.totalTokens;
      m.totalCost += u.costEstimate;
      m.interactionsCount += 1;
    }

    // Convert map to array with percentage
    const byAgent = Array.from(agentMap.values()).map((a) => ({
      ...a,
      totalCost: Math.round(a.totalCost * 1_000_000) / 1_000_000,
      percentage: totalTokens > 0 ? Math.round((a.totalTokens / totalTokens) * 100) : 0,
    }));

    const byModel = Array.from(modelMap.values()).map((m) => ({
      ...m,
      totalCost: Math.round(m.totalCost * 1_000_000) / 1_000_000,
    }));

    const recentActivity = usages.slice(0, 30).map((u) => ({
      id: u.id,
      agentId: u.agentId,
      agentName: u.agent.name,
      model: u.model,
      promptTokens: u.promptTokens,
      completionTokens: u.completionTokens,
      totalTokens: u.totalTokens,
      costEstimate: u.costEstimate,
      createdAt: u.createdAt,
    }));

    return {
      summary: {
        totalTokens,
        promptTokens,
        completionTokens,
        totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
        totalInteractions: usages.length,
        totalAgents: agentMap.size,
      },
      byAgent,
      byModel,
      recentActivity,
    };
  }
}

