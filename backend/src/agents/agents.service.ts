import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Returns supported providers and models metadata for no-code builder
   */
  getAvailableProviders() {
    return [
      {
        id: 'google',
        name: 'Google Gemini',
        description: 'Ultra-fast multimodal reasoning with massive context windows.',
        requiresKey: false, // Can use platform key or BYOK
        models: [
          { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Fast & Accurate)', default: true, contextTokens: 1000000 },
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Latest)', default: false, contextTokens: 1000000 },
          { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', default: false, contextTokens: 1000000 },
          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Frontier Reasoning)', default: false, contextTokens: 2000000 },
        ],
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'Leading frontier models with exceptional reasoning and tool execution.',
        requiresKey: false,
        models: [
          { id: 'gpt-4o', name: 'GPT-4o (Omni)', default: true, contextTokens: 128000 },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost Efficient)', default: false, contextTokens: 128000 },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', default: false, contextTokens: 16385 },
        ],
      },
    ];
  }

  /**
   * Creates a new agent with attached tools
   */
  async create(dto: CreateAgentDto) {
    // Generate clean slug
    const baseSlug = (dto.slug || dto.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await this.prisma.agent.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    // Encrypt BYOK API Key if provided
    const encryptedKey = dto.customVendorApiKey
      ? this.cryptoService.encrypt(dto.customVendorApiKey)
      : null;

    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.create({
        data: {
          name: dto.name,
          description: dto.description,
          slug: finalSlug,
          provider: dto.provider,
          model: dto.model,
          systemPrompt: dto.systemPrompt,
          instructions: dto.instructions,
          guardrails: dto.guardrails,
          temperature: dto.temperature ?? 0.7,
          maxTokens: dto.maxTokens ?? 2048,
          isPublic: dto.isPublic ?? false,
          status: 'PUBLISHED',
          useCustomKey: !!encryptedKey,
          encryptedVendorKey: encryptedKey,
        },
      });

      // Link tools
      if (dto.toolIds && dto.toolIds.length > 0) {
        await tx.agentTool.createMany({
          data: dto.toolIds.map((toolId) => ({
            agentId: agent.id,
            toolId,
          })),
        });
      }

      return tx.agent.findUnique({
        where: { id: agent.id },
        include: {
          tools: {
            include: { tool: true },
          },
        },
      });
    });
  }

  /**
   * Lists all agents (with public marketplace filter support)
   */
  async findAll(onlyPublic?: boolean) {
    return this.prisma.agent.findMany({
      where: onlyPublic ? { isPublic: true } : undefined,
      include: {
        tools: {
          include: { tool: true },
        },
        _count: {
          select: { sessions: true, documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find single agent by ID or Slug
   */
  async findOne(idOrSlug: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        tools: {
          include: { tool: true },
        },
        documents: true,
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent '${idOrSlug}' not found`);
    }

    // Do not leak encrypted keys in response
    const { encryptedVendorKey, ...safeAgent } = agent;
    return {
      ...safeAgent,
      hasCustomKey: !!encryptedVendorKey,
    };
  }

  /**
   * Updates an agent
   */
  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id); // Ensure exists

    const encryptedKey = dto.customVendorApiKey
      ? this.cryptoService.encrypt(dto.customVendorApiKey)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Update core fields
      const updated = await tx.agent.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          provider: dto.provider,
          model: dto.model,
          systemPrompt: dto.systemPrompt,
          instructions: dto.instructions,
          guardrails: dto.guardrails,
          temperature: dto.temperature,
          maxTokens: dto.maxTokens,
          isPublic: dto.isPublic,
          status: dto.status,
          useCustomKey: dto.useCustomKey !== undefined ? dto.useCustomKey : (encryptedKey ? true : undefined),
          encryptedVendorKey: encryptedKey,
        },
      });

      // Update tool links if provided
      if (dto.toolIds !== undefined) {
        await tx.agentTool.deleteMany({ where: { agentId: id } });
        if (dto.toolIds.length > 0) {
          await tx.agentTool.createMany({
            data: dto.toolIds.map((toolId) => ({
              agentId: id,
              toolId,
            })),
          });
        }
      }

      return tx.agent.findUnique({
        where: { id },
        include: {
          tools: {
            include: { tool: true },
          },
        },
      });
    });
  }

  /**
   * Deletes an agent
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }
}

