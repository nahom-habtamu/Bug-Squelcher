export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bug Squelcher API',
    description: 'Tech Debt Bounty Board — bug tracking REST API',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3001' }],
  paths: {
    '/api/bugs': {
      get: {
        summary: 'List all bugs',
        operationId: 'listBugs',
        tags: ['Bugs'],
        responses: {
          '200': {
            description: 'Array of bugs ordered newest first',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Bug' } } } },
          },
        },
      },
      post: {
        summary: 'Create a bug',
        operationId: 'createBug',
        tags: ['Bugs'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBugInput' } } },
        },
        responses: {
          '201': {
            description: 'Bug created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Bug' } } },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/api/bugs/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        summary: 'Get a bug by ID',
        operationId: 'getBugById',
        tags: ['Bugs'],
        responses: {
          '200': { description: 'Bug found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Bug' } } } },
          '404': { description: 'Bug not found' },
        },
      },
      put: {
        summary: 'Update a bug',
        operationId: 'updateBug',
        tags: ['Bugs'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBugInput' } } },
        },
        responses: {
          '200': { description: 'Bug updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Bug' } } } },
          '400': { description: 'Validation error' },
          '404': { description: 'Bug not found' },
        },
      },
      delete: {
        summary: 'Delete a bug',
        operationId: 'deleteBug',
        tags: ['Bugs'],
        responses: {
          '204': { description: 'Bug deleted' },
          '404': { description: 'Bug not found' },
        },
      },
    },
  },
  components: {
    schemas: {
      Severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
      BugStatus: { type: 'string', enum: ['Open', 'In Progress', 'Works on My Machine'] },
      Bug: {
        type: 'object',
        required: ['id', 'title', 'stepsToReproduce', 'severity', 'status', 'createdAt', 'updatedAt'],
        properties: {
          id:               { type: 'string', format: 'uuid' },
          title:            { type: 'string' },
          stepsToReproduce: { type: 'string' },
          severity:         { $ref: '#/components/schemas/Severity' },
          status:           { $ref: '#/components/schemas/BugStatus' },
          createdAt:        { type: 'string', format: 'date-time' },
          updatedAt:        { type: 'string', format: 'date-time' },
        },
      },
      CreateBugInput: {
        type: 'object',
        required: ['title', 'stepsToReproduce', 'severity'],
        properties: {
          title:            { type: 'string', minLength: 1 },
          stepsToReproduce: { type: 'string', minLength: 1 },
          severity:         { $ref: '#/components/schemas/Severity' },
        },
      },
      UpdateBugInput: {
        type: 'object',
        properties: {
          title:            { type: 'string', minLength: 1 },
          stepsToReproduce: { type: 'string', minLength: 1 },
          severity:         { $ref: '#/components/schemas/Severity' },
          status:           { $ref: '#/components/schemas/BugStatus' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              fieldErrors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
            },
          },
        },
      },
    },
  },
};
