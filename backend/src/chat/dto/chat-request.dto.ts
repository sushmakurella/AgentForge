import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

