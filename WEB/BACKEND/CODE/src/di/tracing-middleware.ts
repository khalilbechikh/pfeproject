import type { interfaces } from 'inversify';
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

function safeJson(data: unknown, limit = 4_096): string {
    try {
        return JSON.stringify(data).slice(0, limit);
    } catch {
        return '[unserialisable]';
    }
}

const tracer = trace.getTracer('backend');

export const tracingMiddleware: interfaces.Middleware = (next) => (args) => {
    const instance = next(args);

    if (typeof instance !== 'object' || instance === null) return instance;

    return new Proxy(instance, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            if (typeof original !== 'function') return original;

            /* `this` inside this function refers to the proxied object.
               We annotate it so TS doesn’t infer `any`. */
            return function (this: any, ...methodArgs: unknown[]) {
                const span = tracer.startSpan(
                    `${target.constructor.name}.${String(prop)}`,
                    undefined,
                    context.active(),
                );
                span.setAttribute('code.args', safeJson(methodArgs));

                const runOriginal = () => original.apply(this, methodArgs); // keep proper `this`

                try {
                    const result = context.with(trace.setSpan(context.active(), span), runOriginal);

                    if (result instanceof Promise) {
                        return result
                            .then((r) => {
                                span.setAttribute('code.result', safeJson(r));
                                return r;
                            })
                            .catch((err) => {
                                span.recordException(err as Error);
                                span.setStatus({ code: SpanStatusCode.ERROR });
                                throw err;
                            })
                            .finally(() => span.end());
                    } else {
                        span.setAttribute('code.result', safeJson(result));
                        return result;
                    }
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({ code: SpanStatusCode.ERROR });
                    throw err;
                } finally {
                    span.end();
                }
            };
        },
    });
};
