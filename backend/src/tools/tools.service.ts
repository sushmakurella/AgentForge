import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { CreateToolDto } from './dto/create-tool.dto';

@Injectable()
export class ToolsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultTools();
  }

  /**
   * Seed standard out-of-the-box tools if none exist
   */
  async seedDefaultTools() {
    const existing = await this.prisma.tool.count();
    if (existing === 0) {
      await this.prisma.tool.createMany({
        data: [
          {
            name: 'calculator',
            description: 'Performs mathematical calculations like addition, multiplication, division, and exponents.',
            endpointUrl: 'system://internal/calculator',
            httpMethod: 'POST',
            authType: 'NONE',
            parametersSchema: JSON.stringify({
              type: 'object',
              properties: {
                expression: { type: 'string', description: 'The math expression to evaluate, e.g. "120 * 45 + (18 / 2)"' },
              },
              required: ['expression'],
            }),
            isSystem: true,
          },
          {
            name: 'current_time',
            description: 'Returns the current date, time, and day of the week in any timezone.',
            endpointUrl: 'system://internal/time',
            httpMethod: 'GET',
            authType: 'NONE',
            parametersSchema: JSON.stringify({
              type: 'object',
              properties: {
                timezone: { type: 'string', description: 'Target timezone (e.g. "UTC", "America/New_York", "Asia/Kolkata")' },
              },
              required: [],
            }),
            isSystem: true,
          },
          {
            name: 'web_search',
            description: 'Searches the web for recent information, documentation, and real-time updates.',
            endpointUrl: 'system://internal/search',
            httpMethod: 'POST',
            authType: 'NONE',
            parametersSchema: JSON.stringify({
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The search query to look up on the web' },
              },
              required: ['query'],
            }),
            isSystem: true,
          },
        ],
      });
    }
  }

  /**
   * Registers a new custom tool with encrypted secrets
   */
  async createTool(dto: CreateToolDto) {
    const encryptedSecret = dto.authSecret ? this.cryptoService.encrypt(dto.authSecret) : null;

    return this.prisma.tool.create({
      data: {
        name: dto.name,
        description: dto.description,
        toolType: dto.toolType || (dto.code ? 'CODE' : 'API'),
        code: dto.code || null,
        endpointUrl: dto.endpointUrl || null,
        httpMethod: dto.httpMethod || 'POST',
        customHeaders: dto.customHeaders || null,
        requestBodyFormat: dto.requestBodyFormat || null,
        authType: dto.authType || 'NONE',
        encryptedAuthSecret: encryptedSecret,
        headerKey: dto.headerKey,
        signingSecret: dto.signingSecret,
        parametersSchema: dto.parametersSchema || JSON.stringify({ type: 'object', properties: {} }),
        isSystem: dto.isSystem || false,
      },
    });
  }

  /**
   * Lists all tools (safe view without exposing raw secrets)
   */
  async findAll() {
    const tools = await this.prisma.tool.findMany({
      orderBy: { isSystem: 'desc' },
    });

    return tools.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      toolType: t.toolType,
      code: t.code,
      endpointUrl: t.endpointUrl,
      httpMethod: t.httpMethod,
      customHeaders: t.customHeaders,
      requestBodyFormat: t.requestBodyFormat,
      authType: t.authType,
      hasSecret: !!t.encryptedAuthSecret,
      headerKey: t.headerKey,
      isSystem: t.isSystem,
      parametersSchema: t.parametersSchema ? JSON.parse(t.parametersSchema) : {},
      createdAt: t.createdAt,
    }));
  }

  /**
   * Finds a tool by ID
   */
  async findOne(id: string) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) throw new NotFoundException(`Tool with ID ${id} not found`);
    return tool;
  }

  /**
   * Deletes a tool
   */
  async deleteTool(id: string) {
    const tool = await this.findOne(id);
    if (tool.isSystem) {
      throw new Error('Cannot delete built-in system tools.');
    }
    return this.prisma.tool.delete({ where: { id } });
  }
}

