import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import * as vm from 'vm';
import { CryptoService } from '../common/crypto.service';
import { SsrfValidator } from '../common/ssrf.guard';

export interface ToolExecutionPayload {
  toolName: string;
  toolType?: string; // 'API' | 'CODE'
  code?: string;
  endpointUrl?: string;
  httpMethod?: string;
  customHeaders?: string;
  requestBodyFormat?: string;
  authType?: string;
  encryptedAuthSecret?: string;
  headerKey?: string;
  signingSecret?: string;
  args: Record<string, any>;
  isSystem?: boolean;
}

@Injectable()
export class ToolRunnerService {
  private readonly logger = new Logger(ToolRunnerService.name);

  constructor(private readonly cryptoService: CryptoService) {}

  /**
   * Executes a tool dynamically.
   * Dispatches to:
   * 1. Built-in System Tools
   * 2. Sandboxed JavaScript Code Execution (vm)
   * 3. Authenticated Outbound REST API Call (with SSRF protection)
   */
  async executeTool(payload: ToolExecutionPayload): Promise<any> {
    const { toolName, args, isSystem, toolType, code } = payload;
    this.logger.log(`Executing tool [${toolName}] (${toolType || 'API'}) with arguments: ${JSON.stringify(args)}`);

    // 1. Handle Built-in System Tools
    if (isSystem) {
      return this.executeSystemTool(toolName, args);
    }

    // 2. Handle Sandboxed JavaScript Code Execution
    if (toolType === 'CODE' || (code && !payload.endpointUrl)) {
      return this.executeCodeTool(toolName, code || '', args);
    }

    // 3. Handle REST API Tool Execution
    return this.executeApiTool(payload);
  }

  /**
   * Executes user-supplied JavaScript code inside an isolated Node.js VM sandbox
   */
  private executeCodeTool(toolName: string, code: string, args: any): any {
    try {
      const sandbox = {
        args: args || {},
        console: {
          log: (...msgs: any[]) => this.logger.log(`[Tool Sandbox ${toolName}]: ${msgs.join(' ')}`),
          error: (...msgs: any[]) => this.logger.error(`[Tool Sandbox ${toolName}]: ${msgs.join(' ')}`),
        },
        Math,
        Date,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      };

      const wrappedCode = `
        (function() {
          ${code}
          if (typeof execute === 'function') {
            return execute(args);
          }
          if (typeof handler === 'function') {
            return handler(args);
          }
          return { error: "No 'execute(args)' function was found in the script." };
        })()
      `;

      const script = new vm.Script(wrappedCode);
      const result = script.runInNewContext(sandbox, {
        timeout: 3000, // 3-second hard timeout
      });

      return {
        success: true,
        output: result,
      };
    } catch (error: any) {
      this.logger.error(`Error in JS Code Tool [${toolName}]: ${error.message}`);
      return {
        success: false,
        error: error.message || 'JavaScript execution failed',
      };
    }
  }

  /**
   * Executes an outbound REST API call with SSRF protection and authentication
   */
  private async executeApiTool(payload: ToolExecutionPayload): Promise<any> {
    if (!payload.endpointUrl) {
      return { error: 'No endpoint URL configured for this API tool.' };
    }

    // Validate URL against SSRF
    const validatedUrl = SsrfValidator.validateUrl(payload.endpointUrl);

    // Prepare Request Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AgentMarketplace-Bot/1.0',
      'Accept': 'application/json, text/plain, */*',
    };

    // Inject User-Configured Custom Headers
    if (payload.customHeaders) {
      try {
        const parsed = JSON.parse(payload.customHeaders);
        Object.assign(headers, parsed);
      } catch (err: any) {
        this.logger.warn(`Failed to parse customHeaders for tool [${payload.toolName}]: ${err.message}`);
      }
    }

    // Inject Dynamic Authentication
    if (payload.authType === 'BEARER' && payload.encryptedAuthSecret) {
      const token = this.cryptoService.decrypt(payload.encryptedAuthSecret);
      headers['Authorization'] = `Bearer ${token}`;
    } else if (payload.authType === 'CUSTOM_HEADER' && payload.encryptedAuthSecret) {
      const token = this.cryptoService.decrypt(payload.encryptedAuthSecret);
      headers[payload.headerKey || 'X-API-KEY'] = token;
    } else if (payload.authType === 'BASIC' && payload.encryptedAuthSecret) {
      const creds = this.cryptoService.decrypt(payload.encryptedAuthSecret);
      headers['Authorization'] = `Basic ${Buffer.from(creds).toString('base64')}`;
    } else if (payload.authType === 'HMAC' && payload.signingSecret) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const bodyString = JSON.stringify(payload.args || {});
      const signature = crypto
        .createHmac('sha256', payload.signingSecret)
        .update(`${timestamp}.${bodyString}`)
        .digest('hex');

      headers['X-Signature-Timestamp'] = timestamp;
      headers['X-Signature'] = `t=${timestamp},v1=${signature}`;
    }

    // Execute HTTP Request with Safe Timeout
    const method = (payload.httpMethod || 'POST').toUpperCase();
    const config: AxiosRequestConfig = {
      url: validatedUrl.toString(),
      method,
      headers,
      timeout: 10000, // 10 seconds max timeout
      maxRedirects: 3,
    };

    if (method === 'GET' || method === 'DELETE') {
      config.params = payload.args;
    } else {
      config.data = payload.args;
    }

    try {
      const response = await axios(config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Error calling tool endpoint [${payload.endpointUrl}]: ${error.message}`);
      return {
        success: false,
        error: error.response?.data || error.message || 'Tool execution failed',
        status: error.response?.status || 500,
      };
    }
  }

  /**
   * Internal System Tools (Built-in out of the box)
   */
  private executeSystemTool(name: string, args: any): any {
    switch (name.toLowerCase()) {
      case 'calculator': {
        try {
          const expression = String(args.expression || '');
          if (!/^[0-9+\-*/().\s^%]+$/.test(expression)) {
            return { error: 'Invalid mathematical expression' };
          }
          // eslint-disable-next-line no-eval
          const result = Function(`'use strict'; return (${expression})`)();
          return { expression, result };
        } catch {
          return { error: 'Could not compute calculation' };
        }
      }

      case 'current_time': {
        const timezone = args.timezone || 'UTC';
        return {
          iso: new Date().toISOString(),
          formatted: new Date().toLocaleString('en-US', { timeZone: timezone }),
          timezone,
        };
      }

      case 'web_search': {
        const query = String(args.query || '');
        return {
          query,
          results: [
            {
              title: `Search result for: ${query}`,
              snippet: `Simulated top web result regarding ${query} for agent context enrichment.`,
              source: 'https://search.mock',
            },
          ],
        };
      }

      default:
        return {
          notice: `System tool '${name}' executed successfully with args: ${JSON.stringify(args)}`,
        };
    }
  }
}
