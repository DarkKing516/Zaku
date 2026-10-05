import { Request, Response } from 'express';

export const SCALAR_STUB_MARKER = 'scalar-api-reference-stub';

interface ApiReferenceOptions {
  readonly spec?: { readonly content?: { readonly info?: { readonly title?: string } } };
}

export function apiReference(options: ApiReferenceOptions): (request: Request, response: Response) => void {
  const specificationTitle = options.spec?.content?.info?.title ?? 'missing specification';
  return (_request, response) => {
    response.type('html').send(`<!doctype html><title>${SCALAR_STUB_MARKER}: ${specificationTitle}</title>`);
  };
}
