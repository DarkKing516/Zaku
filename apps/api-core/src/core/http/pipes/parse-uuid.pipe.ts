import { Injectable, PipeTransform } from '@nestjs/common';
import { isUuid } from '@common/utils/uuid';
import { RequestValidationError } from '../request-validation.errors';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  constructor(private readonly field: string) {}

  transform(value: string): string {
    if (!isUuid(value)) {
      throw new RequestValidationError([{ field: this.field, message: `${this.field} must be a UUID` }]);
    }
    return value.toLowerCase();
  }
}

export function parseUuid(field: string): ParseUuidPipe {
  return new ParseUuidPipe(field);
}
