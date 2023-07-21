# Next Zod API

![npm](https://img.shields.io/npm/v/next-zod-api)
![license](https://img.shields.io/npm/l/next-zod-api)

> :warning: This package is for the *newer* [**App Router**](https://nextjs.org/docs/app) which is introduced in Next.JS 13. If you are using the *older* [Pages Router](https://nextjs.org/docs/pages), use [next-better-api](https://github.com/filp/next-better-api) instead.

A [Next.JS](https://nextjs.org/) API handler that validates request and response using [Zod](https://github.com/colinhacks/zod).

Simplify the creation of API endpoints in Next.JS with a method `endpoint` that handles validation of query parameters, body payload (json, form data, etc), and the response.

This package was intended as an App Router compatible rewrite of [next-better-api](https://github.com/filp/next-better-api/) so I kept the `endpoint` function work the same way.

#### Jump to example code:
* [GET Example](#get-example)
* [PUT Example with request body](#put-example-with-request-body)
* [POST Example with form data](#post-example-with-form-data)
* [CORS Helper](#cors-helper)

## Installation

```bash
npm install next-zod-api
```

or

```bash
yarn add next-zod-api
```

## Usage

### All parameters

```js
import { endpoint, z } from 'next-zod-api';

export const (GET|POST|PUT|PATCH|DELETE) = endpoint({
    /* 
      (optional) These are all optional validators using Zod
    */
    querySchema: z(...),
    bodySchema: z(...),
    responseSchema: z(...)
}, async ({ params, query, body, headers }) => {
    /*
      params: Route parameters such as [slug] in /path/[slug]/route.js
      query: GET parameters: ?key=value&key2=value2
      body: POST request data parsed (json / multipart/form-data / text)
      headers: Request headers parsed into an object {key: value}
    */
    return {
        status: (HTTP_STATUS_CODE),
        body: {OUTPUT_AS_JSON},
        headers:{RESPONSE_HEADERS}
    };
});
```

### GET Example

#### **`/app/api/user/route.js`**
```js
import { endpoint, z } from 'next-zod-api';

export const GET = endpoint({
    querySchema: z.object({
        sort: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional()
    }),
    responseSchema: z.object({
        users: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
                active: z.boolean()
            })
        )
    })
}, async ({ query }) => {
    const users = await getUsers({
        sort: query.sort,
        page: query.page,
        perPage: query.perPage
    });

    return {
        status: 200,
        body: {
            users
        }
    };
});
```

### PUT Example with request body

#### **`/app/api/user/[user_id]/route.js`**
```js
import { endpoint, z } from 'next-zod-api';

export const PUT = endpoint({
    bodySchema: z.object({
        name: z.string(),
        email: z.string().email()
    }),
    responseSchema: z.object({
        success: z.boolean(),
        user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
            active: z.boolean()
        })
    })
}, async ({ params, body }) => {
    const user = await updateUser(params.user_id, body);

    return {
        status: 201,
        body: {
            success: true,
            user
        }
    };
});
```

### POST Example with form data

#### **`/app/api/user/[user_id]/avatar/route.js`**
```js
import { endpoint, z } from 'next-zod-api';
import fs from 'fs';

export const POST = endpoint({
    bodySchema: z.object({
        file: z.any().refine(value => {
            return value.constructor.name === 'File';
        }, {
            message: 'Must be a file',
        }),
        /* Or alternatively, if the browser 'File' object is available in your environment: */
        file: z.instanceof(File)
    }),
    responseSchema: z.object({
        success: z.boolean(),
        fileName: z.string()
    })
}, async ({ params, body }) => {
    const { file } = body;
    const fileName = file.name;
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync('./uploads/'+fileName, buffer)

    return {
        status: 200,
        body: {
            success: true,
            fileName
        }
    };
});
```

### CORS Helper

The package includes a helper function to handle Cross-Origin Resource Sharing (CORS) in your API endpoints. CORS is a mechanism that allows resources on a web page to be requested from another domain outside the domain from which the resource originated.

Import the `cors` function from the package and use it to create CORS headers and a preflight response for your API endpoints.

Here's how to use it:

```js
import { endpoint, cors, z } from 'next-zod-api';
const { preflight, corsHeaders } = cors();
export const OPTIONS = preflight;
```

And add the CORS headers to your responses:

```js
export const POST = endpoint({
//...
},async ()=>{
  return {
    body: ...,
    headers: corsHeaders
  }
});
```

The `cors` function accepts an optional configuration object where you can specify the `origin` and `allowHeaders`:

```js
const { preflight, corsHeaders } = cors({
  origin: "https://example.com",
  allowHeaders: "Content-Type, Authorization, X-Requested-With"
});
```

- `origin` (optional): Configures the `Access-Control-Allow-Origin` CORS header. Defaults to `"*"`, which allows any origin.
- `allowHeaders` (optional): Configures the `Access-Control-Allow-Headers` CORS header. Defaults to `"Content-Type, Authorization, X-Requested-With"`, which allows these headers to be used in the actual request.

The `cors` function returns an object with two properties:

- `corsHeaders`: An object with CORS headers that can be included in a response.
- `preflight`: A function that returns a preflight response, which is a simple response with a 200 status and the CORS headers. You can use this for handling OPTIONS requests, which are sent by browsers as part of the CORS preflight process. 

## License

MIT