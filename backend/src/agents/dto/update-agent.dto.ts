import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class UpdateAgentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['google', 'openai', 'anthropic'])
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  guardrails?: string;

  @IsNumber()
  @Min(0.0)
  @Max(2.0)
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @Min(64)
  @Max(8192)
  @IsOptional()
  maxTokens?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  useCustomKey?: boolean;

  @IsString()
  @IsOptional()
  customVendorApiKey?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toolIds?: string[];
}

