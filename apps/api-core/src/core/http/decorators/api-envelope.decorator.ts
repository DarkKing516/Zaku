import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ApiErrorResponseDto, ApiSuccessResponseDto } from '../dtos/api-response.dto';

export interface ApiEnvelopeOptions {
  readonly status?: HttpStatus;
  readonly description?: string;
  readonly isArray?: boolean;
  readonly paginated?: boolean;
  readonly errors?: readonly HttpStatus[];
}

export function ApiEnvelope(dataType: Type<unknown> | null, options: ApiEnvelopeOptions = {}): MethodDecorator {
  const status = options.status ?? HttpStatus.OK;
  const isCollection = options.isArray === true || options.paginated === true;

  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, ApiErrorResponseDto, ...(dataType ? [dataType] : [])),
    ApiResponse({
      status,
      description: options.description ?? (options.paginated ? 'Paginated result, see meta.pagination' : undefined),
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponseDto) },
          { properties: { data: dataSchemaFor(dataType, isCollection) } },
        ],
      },
    }),
    ...(options.errors ?? []).map((errorStatus) =>
      ApiResponse({ status: errorStatus, schema: { $ref: getSchemaPath(ApiErrorResponseDto) } }),
    ),
  );
}

function dataSchemaFor(dataType: Type<unknown> | null, isCollection: boolean): SchemaObject | ReferenceObject {
  if (!dataType) {
    return { nullable: true, example: null };
  }
  const itemSchema = { $ref: getSchemaPath(dataType) };
  return isCollection ? { type: 'array', items: itemSchema } : itemSchema;
}
