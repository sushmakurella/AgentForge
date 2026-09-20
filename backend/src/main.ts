import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with credentials for Better Auth cookies and headers
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive origin with credentials support for production deployment
    },
    credentials: true,
    exposedHeaders: ['set-auth-token', 'Authorization'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie', 'set-auth-token'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });



  // Enable global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend server running on: http://localhost:${port}`);
}

bootstrap();
