import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { ToolRunnerService } from '../tools/tool-runner.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool as createSdkTool } from 'ai';
import { z } from 'zod';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly toolRunnerService: ToolRunnerService,
  ) {}

  /**
   * Executes a chat turn with an agent.
   * Compiles System Prompt + Instructions + Guardrails, binds tools,
   * calls the model via Vercel AI SDK, and saves session history in Neon DB.
   */
  async executeChat(dto: ChatRequestDto) {
    const { agentId, message, userId } = dto;

    // 1. Fetch Agent with attached Tools from Neon DB
    const agent = await this.prisma.agent.findFirst({
      where: {
        OR: [{ id: agentId }, { slug: agentId }],
      },
      include: {
        tools: {
          include: { tool: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent '${agentId}' not found.`);
    }

    // 2. Manage Chat Session (Find or Create in Neon DB)
    let sessionId = dto.sessionId;
    if (!sessionId) {
      const session = await this.prisma.chatSession.create({
        data: {
          agentId: agent.id,
          userId,
          title: message.slice(0, 40) + '...',
        },
      });
      sessionId = session.id;
    }

    // Record the user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // 3. Compile the Complete System Prompt
    const compiledSystemPrompt = this.compileSystemPrompt(agent);

    // 4. Construct Dynamic Tools for Vercel AI SDK
    const sdkTools = this.buildSdkTools(agent.tools.map((at) => at.tool));

    // 5. Determine Provider & API Key
    let vendorKey = '';
    if (agent.useCustomKey && agent.encryptedVendorKey) {
      vendorKey = this.cryptoService.decrypt(agent.encryptedVendorKey);
    } else if (agent.provider === 'google') {
      vendorKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    } else if (agent.provider === 'openai') {
      vendorKey = process.env.OPENAI_API_KEY || '';
    }

    // 6. Execute Model Inference or Sandbox Simulator
    let replyText = '';
    let executedToolCalls: any[] = [];
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    if (vendorKey) {
      try {
        const modelInstance = this.getModelInstance(agent.provider, agent.model, vendorKey);

        const result = await generateText({
          model: modelInstance,
          system: compiledSystemPrompt,
          prompt: message,
          temperature: agent.temperature,
          maxOutputTokens: agent.maxTokens,
          tools: sdkTools,
          maxSteps: 5, // Allow multiple tool reasoning hops
        } as any);

        replyText = result.text || '';
        executedToolCalls = result.steps?.flatMap((s) => s.toolCalls || []) || [];
        if (result?.usage) {
          const u = result.usage as any;
          promptTokens = u.promptTokens ?? u.inputTokens ?? 0;
          completionTokens = u.completionTokens ?? u.outputTokens ?? 0;
          totalTokens = u.totalTokens ?? (promptTokens + completionTokens);
        }

        if (!replyText && executedToolCalls.length > 0) {
          replyText = `Action executed successfully.`;
        }
      } catch (error: any) {
        this.logger.error(`Live LLM invocation error: ${error.message}`);
        
        // Automatic fallback for deprecated or version-mismatched Gemini models
        if (agent.provider === 'google' && (error.message?.includes('not found') || error.message?.includes('not supported'))) {
          try {
            this.logger.warn(`Attempting fallback to 'gemini-flash-latest'...`);
            const fallbackInstance = this.getModelInstance('google', 'gemini-flash-latest', vendorKey);
            const fallbackResult = await generateText({
              model: fallbackInstance,
              system: compiledSystemPrompt,
              prompt: message,
              temperature: agent.temperature,
              maxOutputTokens: agent.maxTokens,
              tools: sdkTools,
              maxSteps: 5,
            } as any);
            replyText = fallbackResult.text;
            executedToolCalls = fallbackResult.steps?.flatMap((s) => s.toolCalls || []) || [];
            if (fallbackResult?.usage) {
              const fu = fallbackResult.usage as any;
              promptTokens = fu.promptTokens ?? fu.inputTokens ?? 0;
              completionTokens = fu.completionTokens ?? fu.outputTokens ?? 0;
              totalTokens = fu.totalTokens ?? (promptTokens + completionTokens);
            }
          } catch (fallbackError: any) {
            replyText = `[Model Error]: Unable to complete model request: ${fallbackError.message}`;
          }
        } else {
          replyText = `[Model Error]: Unable to complete model request: ${error.message}`;
        }
      }
    } else {
      // Elegant Simulator Mode if no vendor key is present yet
      replyText = this.generateSimulatedReply(agent, message, sdkTools);
    }

    // Fallback token estimation if usage was not returned by API
    if (!totalTokens) {
      promptTokens = Math.max(1, Math.ceil((compiledSystemPrompt.length + message.length) / 4));
      completionTokens = Math.max(1, Math.ceil(replyText.length / 4));
      totalTokens = promptTokens + completionTokens;
    }

    const costEstimate = this.estimateCost(agent.provider, agent.model, promptTokens, completionTokens);

    // 7. Persist Assistant Reply in Neon DB
    const savedMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: replyText,
        toolCalls: executedToolCalls.length > 0 ? JSON.stringify(executedToolCalls) : null,
        tokensUsed: totalTokens,
      },
    });

    // 8. Record Token Usage Event for Analytics Dashboard
    await this.prisma.tokenUsage.create({
      data: {
        agentId: agent.id,
        userId: userId || agent.creatorId || null,
        sessionId,
        model: agent.model,
        provider: agent.provider,
        promptTokens,
        completionTokens,
        totalTokens,
        costEstimate,
      },
    });

    return {
      sessionId,
      agent: {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        provider: agent.provider,
      },
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: replyText,
        toolCalls: executedToolCalls,
        createdAt: savedMessage.createdAt,
      },
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
        costEstimate,
      },
    };
  }

  private estimateCost(provider: string, model: string, promptTokens: number, completionTokens: number): number {
    const m = (model || '').toLowerCase();
    let promptRate = 0.075 / 1_000_000;
    let completionRate = 0.30 / 1_000_000;

    if (m.includes('gpt-4o') || m.includes('pro') || m.includes('claude-3-5-sonnet')) {
      promptRate = 2.50 / 1_000_000;
      completionRate = 10.00 / 1_000_000;
    } else if (m.includes('mini') || m.includes('flash')) {
      promptRate = 0.075 / 1_000_000;
      completionRate = 0.30 / 1_000_000;
    }

    const cost = promptTokens * promptRate + completionTokens * completionRate;
    return Math.round(cost * 1_000_000) / 1_000_000;
  }

  /**
   * Retrieves chat history for a session
   */
  async getSessionHistory(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Compiles system persona + business instructions + guardrails into a cohesive prompt
   */
  private compileSystemPrompt(agent: any): string {
    const parts: string[] = [];

    // Core System Persona
    parts.push(`=== CORE SYSTEM PERSONA ===\n${agent.systemPrompt}`);

    // Business Instructions
    if (agent.instructions && agent.instructions.trim()) {
      parts.push(`=== BEHAVIORAL INSTRUCTIONS ===\n${agent.instructions.trim()}`);
    }

    // Guardrails & Safety Constraints
    if (agent.guardrails && agent.guardrails.trim()) {
      parts.push(
        `=== CRITICAL GUARDRAILS & SAFETY CONSTRAINTS ===\n` +
        `You MUST strictly adhere to the following safety guardrails at all times:\n` +
        `${agent.guardrails.trim()}`
      );
    }

    return parts.join('\n\n');
  }

  /**
   * Dynamically translates DB tool definitions into Vercel AI SDK executable tools
   */
  private buildSdkTools(tools: any[]): Record<string, any> {
    const sdkTools: Record<string, any> = {};

    for (const tool of tools) {
      sdkTools[tool.name] = createSdkTool({
        description: tool.description,
        parameters: z.object({}).passthrough(),
        execute: async (args: any) => {
          this.logger.log(`AI Model invoked tool [${tool.name}] with: ${JSON.stringify(args)}`);
          return this.toolRunnerService.executeTool({
            toolName: tool.name,
            toolType: tool.toolType,
            code: tool.code,
            endpointUrl: tool.endpointUrl,
            httpMethod: tool.httpMethod,
            customHeaders: tool.customHeaders,
            requestBodyFormat: tool.requestBodyFormat,
            authType: tool.authType,
            encryptedAuthSecret: tool.encryptedAuthSecret,
            headerKey: tool.headerKey,
            signingSecret: tool.signingSecret,
            args,
            isSystem: tool.isSystem,
          });
        },
      } as any);
    }

    return sdkTools;
  }

  /**
   * Instantiates provider client based on configuration
   */
  private getModelInstance(provider: string, model: string, apiKey: string) {
    if (provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey });
      let targetModel = model;
      if (
        !targetModel ||
        targetModel === 'gemini-1.5-flash' ||
        targetModel === 'gemini-1.5-flash-latest' ||
        targetModel.includes('1.5-flash')
      ) {
        targetModel = 'gemini-flash-latest';
      } else if (
        targetModel === 'gemini-1.5-pro' ||
        targetModel === 'gemini-1.5-pro-latest' ||
        targetModel.includes('1.5-pro')
      ) {
        targetModel = 'gemini-3.1-pro-preview';
      }
      return google(targetModel);
    }

    if (provider === 'openai') {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Generates a rich simulation response when no vendor key is provided
   */
  private generateSimulatedReply(agent: any, message: string, tools: Record<string, any>): string {
    const toolList = Object.keys(tools);
    const toolsDescription = toolList.length > 0 ? toolList.join(', ') : 'No external tools attached';

    return (
      `Hello! I am ${agent.name}, running on ${agent.provider} (${agent.model}).\n\n` +
      `I received your query: "${message}"\n\n` +
      `Here is my active runtime configuration loaded from Neon PostgreSQL:\n` +
      `• System Prompt: "${agent.systemPrompt}"\n` +
      `• Active Tools: [${toolsDescription}]\n` +
      `• Temperature: ${agent.temperature}\n` +
      `• Guardrails: ${agent.guardrails || 'Standard safety active'}\n\n` +
      `[Ready for Live Model]: To connect live OpenAI / Google Gemini inference, provide your API key in agent configuration (BYOK) or backend .env.`
    );
  }
}

