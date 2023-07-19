# Next Zod API

![npm](https://img.shields.io/npm/v/next-zod-api)
![license](https://img.shields.io/npm/l/next-zod-api)

A [NextJS](https://nextjs.org/) API handler for the [**App Router**](https://nextjs.org/docs/app) that validates request and response using [Zod](https://github.com/colinhacks/zod).

Simplify the creation of API endpoints in NextJS with a method `endpoint` that handles validation of query parameters, body parameters, form data, and the response.

This package was intended as an App Router compatible rewrite of [next-better-api](https://github.com/filp/next-better-api/) so I kept the `endpoint` function work the same way.

## Installation

```bash
npm install next-zod-api
```

or

```bash
yarn add next-zod-api
```

## Usage

```ts
import { endpoint, z } from 'next-zod-api';

export const GET = endpoint({
  querySchema: z.object({
    id: z.string()
  }),
  responseSchema: z.object({
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      active: z.boolean()
    }),
  }),
}, async ({ query }) => {
  const user = await getUser(query.id);

  return {
    status: 200,
    body: {
      user,
    },
  };
});
```

## API

### endpoint(options: NextZodApiOptions, handler: NextZodApiHandler)

- `options`: An object that contains the zod schemas for validation.
  - `querySchema?`: A zod schema to validate the query parameters. If omitted, no validation will occur.
  - `bodySchema?`: A zod schema to validate the body parameters. If omitted, no validation will occur.
  - `formDataSchema?`: A zod schema to validate the form data. If omitted, no validation will occur.
  - `responseSchema?`: A zod schema to validate the response. If omitted, no validation will occur.
- `handler`: A function to handle the request which receives the input data as `{query, body, formData}` (parsed into objects). The function should return an object with a `status` code and a `body` object that will be returned as json.

## License

MIT