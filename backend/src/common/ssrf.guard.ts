import { BadRequestException } from '@nestjs/common';
import * as net from 'net';

export class SsrfValidator {
  private static readonly BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254', // AWS/GCP metadata endpoint
    'metadata.google.internal',
  ]);

  /**
   * Asserts that a target URL is public and safe from SSRF attacks.
   * Throws BadRequestException if the URL targets internal networks.
   */
  static validateUrl(targetUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new BadRequestException(`Invalid tool endpoint URL: ${targetUrl}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Only HTTP and HTTPS protocols are allowed for tool endpoints.');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (this.BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
      throw new BadRequestException('Outbound requests to private/internal hostnames are blocked (SSRF Protection).');
    }

    // Check IP address ranges if hostname is an IP
    if (net.isIP(hostname)) {
      if (this.isPrivateIP(hostname)) {
        throw new BadRequestException('Outbound requests to private IP ranges are blocked (SSRF Protection).');
      }
    }

    return parsed;
  }

  /**
   * Validates if an IP address belongs to private/reserved RFC ranges.
   */
  private static isPrivateIP(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;

    // IPv4 private ranges
    const parts = ip.split('.').map(Number);
    if (parts.length === 4) {
      // 10.0.0.0 - 10.255.255.255
      if (parts[0] === 10) return true;
      // 172.16.0.0 - 172.31.255.255
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0 - 192.168.255.255
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 169.254.0.0 - 169.254.255.255 (Link-local & Cloud Metadata)
      if (parts[0] === 169 && parts[1] === 254) return true;
    }

    return false;
  }
}

