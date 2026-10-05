import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ApiErrorBody,
  ApiErrorDetail,
  ApiErrorResponse,
  ApiResponseMeta,
  ApiSuccessResponse,
  PaginationMeta,
} from '@zaku/shared-types';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  totalItems!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class ApiResponseMetaDto implements ApiResponseMeta {
  @ApiProperty({ example: '6f1c2b1e-8d0a-4c5e-9b8f-2f3d4c5b6a7e' })
  requestId!: string;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: '/api/v1/tenants' })
  path?: string;

  @ApiPropertyOptional({ type: PaginationMetaDto })
  pagination?: PaginationMetaDto;
}

export class ApiSuccessResponseDto implements ApiSuccessResponse<unknown> {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'OK' })
  message!: string;

  @ApiProperty({ type: 'object', nullable: true })
  data!: unknown;

  @ApiProperty({ type: ApiResponseMetaDto })
  meta!: ApiResponseMetaDto;
}

export class ApiErrorDetailDto implements ApiErrorDetail {
  @ApiPropertyOptional({ example: 'email' })
  field?: string;

  @ApiProperty({ example: 'email must be an email' })
  message!: string;
}

export class ApiErrorBodyDto implements ApiErrorBody {
  @ApiProperty({ example: 'VALIDATION_FAILED' })
  code!: string;

  @ApiProperty({ type: [ApiErrorDetailDto] })
  details!: ApiErrorDetailDto[];
}

export class ApiErrorResponseDto implements ApiErrorResponse {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiProperty({ type: 'object', nullable: true, example: null })
  data!: null;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;

  @ApiProperty({ example: 'https://http.cat/400' })
  errorImage!: string;

  @ApiProperty({ type: ApiResponseMetaDto })
  meta!: ApiResponseMetaDto;
}
