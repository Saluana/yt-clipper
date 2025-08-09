// Optional OpenAPI generator: only use when env flag ENABLE_OPENAPI === 'true'
// We avoid importing 'zod-to-openapi' types at compile time to keep it optional.
import { z } from 'zod';
export async function maybeGenerateOpenApi() {
    if (process.env.ENABLE_OPENAPI !== 'true')
        return null;
    const { OpenAPIGenerator, extendZodWithOpenApi } = (await import('zod-to-openapi'));
    extendZodWithOpenApi(z);
    const S = await import('./schemas');
    const registry = new OpenAPIGenerator({
        CreateJobInput: S.CreateJobInput,
        JobRecord: S.JobRecord,
    }, '3.0.0');
    return registry.generateDocument({
        openapi: '3.0.0',
        info: { title: 'Clipper API', version: '1.0.0' },
        paths: {},
    });
}
