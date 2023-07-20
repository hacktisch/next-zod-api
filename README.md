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

### All parameters

```js
import { endpoint, z } from 'next-zod-api';

export const (GET|POST|PUT|PATCH|DELETE) = endpoint({
    /* 
      These are all optional validators using Zod
    */
    querySchema: z(...),
    bodySchema: z(...),
    formDataSchema: z(...),
    responseSchema: z(...)
}, async ({ params, query, body, formData, headers }) => {
    /*
      params: Route parameters such as [slug] in /path/[slug]/route.js
      query: GET parameters: ?key=value&key2=value2
      body: POST request data parsed JSON body
      formData: POST request data in html form format (multipart)
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

export const POST = endpoint({
    formDataSchema: z.object({
        file: z.instanceof(File)
    }),
    responseSchema: z.object({
        success: z.boolean(),
        fileName: z.string()
    })
}, async ({ params, formData }) => {
    const { file } = formData;
    const fileName = await saveAvatar(params.user_id, file);

    return {
        status: 200,
        body: {
            success: true,
            fileName
        }
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
- `handler`: A function to handle the request which receives the input data as `{query, body, formData, params, headers}` (parsed into objects). The function should return an object with a `status` code and a `body` object that will be returned as json. Optionally, you can return a response `headers` object (e.g. `{'X-Hello-From-Api-Route':'hello'}`).



## License

MIT