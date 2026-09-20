import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { auth } from './auth';

@Controller('api/auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    console.log('>>> handleAuth received:', req.method, req.originalUrl, 'body:', req.body);
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.get('host') || 'localhost:4000';
      const url = `${protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          headers.set(key, Array.isArray(val) ? val.join(', ') : (val as string));
        }
      }

      const reqInit: RequestInit = {
        method: req.method,
        headers,
      };

      if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
        reqInit.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      }

      const webReq = new Request(url, reqInit);
      const webRes = await auth.handler(webReq);

      res.status(webRes.status);
      webRes.headers.forEach((val, key) => {
        if (key === 'set-cookie') {
          const cookies = (webRes.headers as any).getSetCookie
            ? (webRes.headers as any).getSetCookie()
            : [val];
          res.setHeader('set-cookie', cookies);
        } else {
          res.setHeader(key, val);
        }
      });

      const bodyText = await webRes.text();
      res.send(bodyText);
    } catch (err: any) {
      console.error('Better Auth execution error:', err);
      res.status(500).json({ message: err.message || 'Authentication error' });
    }
  }
}
