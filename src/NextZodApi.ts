import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type NextZodApiOptions = {
  querySchema?: z.ZodType<any, any>,
  bodySchema?: z.ZodType<any, any>,
  formDataSchema?: z.ZodType<any, any>,
  responseSchema?: z.ZodType<any, any>
}

type NextZodApiHandler = (data: { query: any, body: any, formData: any }) => Promise<{ status: number, body: any }>;

function formDataToObject(formData: any): { [key: string]: any } {
  let object: { [key: string]: any } = {};
  for (let [key, value] of formData.entries()) {
    if (object.hasOwnProperty(key)) {
      if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
      }
      object[key].push(value);
    } else {
      object[key] = value;
    }
  }
  return object;
}

export function endpoint(options: NextZodApiOptions, handler: NextZodApiHandler) {
  const { querySchema, bodySchema, responseSchema, formDataSchema } = options;

  const any = z.any();
  const defaultResult = { success: true, data: null }

  return async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);

    const queryResult = (querySchema || any).safeParse(Object.fromEntries(searchParams));
    const bodyResult = req.body || bodySchema ? (bodySchema || any).safeParse(await req.json()) : defaultResult;

    let formData;
    if (formDataSchema || req.headers.get('content-type')?.startsWith('multipart/form-data')) {
      try {
        const form = await req.formData();
        formData = formDataToObject(form);

      } catch (e) {
        return NextResponse.json({ error: 'No form data found' }, { status: 400 });
      }

    }
    const formDataResult = formData || formDataSchema ? (formDataSchema || any).safeParse(formData) : defaultResult;


    if (!queryResult.success || !bodyResult.success || !formDataResult.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    try {
      const { status, body } = await handler({
        query: queryResult.data,
        body: bodyResult.data,
        formData: formDataResult.data,
      });
      const responseBodyResult = (responseSchema || any).safeParse(body);

      if (!responseBodyResult.success) {
        return NextResponse.json({ error: 'Invalid response data' }, { status: 500 });
      }

      return NextResponse.json(responseBodyResult.data, { status });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}