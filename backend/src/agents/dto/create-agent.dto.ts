import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsIn(['google', 'openai', 'anthropic'])
  provider: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

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

