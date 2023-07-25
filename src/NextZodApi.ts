import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type NextZodApiOptions = {
  querySchema?: z.ZodType<any, any>;
  bodySchema?: z.ZodType<any, any>;
  responseSchema?: z.ZodType<any, any>;
};

type NextZodApiHandler = (data: {
  params: any;
  query: any;
  body: any;
  headers: any;
}) => Promise<{ status: number; body: any; headers: any }>;

function formDataToObject(formData: any): { [key: string]: any } {
  let object: { [key: string]: any } = {};
  for (let key of formData.keys()) {
    if (formData.getAll(key).length > 1) {
      object[key] = formData.getAll(key);
    } else {
      object[key] = formData.get(key);
    }
  }
  return object;
}

export function endpoint(
  options: NextZodApiOptions | NextZodApiHandler,
  handler?: NextZodApiHandler
) {
  let opts: NextZodApiOptions;
  if (typeof options === "function") {
    handler = options;
    opts = {};
  } else {
    opts = options;
  }
  const { querySchema, bodySchema, responseSchema } = opts;

  const any = z.any();
  const defaultResult = { success: true, data: {} };

  return async (req: NextRequest, { params }: any = { params: {} }) => {
    const { searchParams } = new URL(req.url);
    const contentType = req.headers.get("content-type") || "";

    const queryResult = (querySchema || any).safeParse(
      Object.fromEntries(searchParams)
    );

    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (contentType.includes("application/json")) {
        try {
          body = await req.json();
        } catch (e) {
          return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
          );
        }
      } else if (contentType.includes("multipart/form-data")) {
        try {
          const form = await req.formData();
          body = formDataToObject(form);
        } catch (e) {
          return NextResponse.json(
            { error: "No form data found" },
            { status: 400 }
          );
        }
      } else {
        try {
          body = await req.text();
        } catch (e) { }
      }
    }

    const bodyResult =
      body !== null || bodySchema
        ? (bodySchema || any).safeParse(body)
        : defaultResult;

    if (!queryResult.success || !bodyResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    try {
      const requestHeaders = Object.fromEntries(req.headers);
      const {
        status,
        body,
        headers: setHeaders,
      } = await (handler as NextZodApiHandler)({
        params,
        query: queryResult.data,
        body: bodyResult.data,
        headers: requestHeaders,
      });
      const responseBodyResult = (responseSchema || any).safeParse(body);

      if (!responseBodyResult.success) {
        return NextResponse.json(
          { error: "Invalid response data" },
          { status: 500 }
        );
      }

      let headers;
      if (setHeaders) {
        headers = new Headers(setHeaders);
      }

      return NextResponse.json(responseBodyResult.data, { status, headers });
    } catch (err) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

interface CorsOptions {
  origin?: string;
  allowHeaders?: string;
}

export function cors({
  origin = "*",
  allowHeaders = "Content-Type, Authorization, X-Requested-With",
}: CorsOptions = {}): {
  corsHeaders: { [key: string]: string };
  preflight: () => NextResponse;
} {
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": allowHeaders,
  };
  const preflight = (): NextResponse => {
    return NextResponse.json({}, { headers: corsHeaders, status: 200 });
  };
  return { corsHeaders, preflight };
}