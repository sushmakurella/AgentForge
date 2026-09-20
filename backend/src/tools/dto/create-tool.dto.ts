import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateToolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsIn(['API', 'CODE'])
  @IsOptional()
  toolType?: string; // 'API' | 'CODE'

  @IsString()
  @IsOptional()
  code?: string; // JavaScript code if toolType === 'CODE'

  @IsString()
  @IsOptional()
  endpointUrl?: string; // Target URL if toolType === 'API'

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE'])
  @IsOptional()
  httpMethod?: string;

  @IsString()
  @IsOptional()
  customHeaders?: string; // Custom JSON headers string e.g. '{"X-Custom": "val"}'

  @IsString()
  @IsOptional()
  requestBodyFormat?: string; // Request body format

  @IsString()
  @IsIn(['NONE', 'BEARER', 'CUSTOM_HEADER', 'BASIC', 'HMAC'])
  @IsOptional()
  authType?: string;

  @IsString()
  @IsOptional()
  authSecret?: string; // Stored encrypted

  @IsString()
  @IsOptional()
  headerKey?: string; // e.g. "X-API-KEY"

  @IsString()
  @IsOptional()
  signingSecret?: string; // For HMAC signing

  @IsString()
  @IsOptional()
  parametersSchema?: string; // JSON Schema for LLM parameters

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
