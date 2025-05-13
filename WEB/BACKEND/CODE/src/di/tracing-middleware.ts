import { interfaces } from 'inversify';
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

/** Helper: safe JSON that never explodes Jaeger & trims to 4 KB */
function safeJson(data: unknown, limit = 4_096): string {
    try {
        return JSON.stringify(data).slice(0, limit);
    } catch {
        return '[unserialisable]';
    }
}

const tracer = trace.getTracer('backend');

/**
 * Inversify middleware: every resolved instance is proxied so that
 * each public method call starts a child span named
 *   ClassName.methodName
 */
export const tracingMiddleware: interfaces.Middleware = (next) => (args) => {
    const instance = next(args);

    if (typeof instance !== 'object' || instance === null) {
        return instance; // nothing to proxy (primitive or undefined)
    }

    return new Proxy(instance, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            if (typeof original !== 'function') return original; // not a method

            return function (...methodArgs: unknown[]) {
                const spanName = `${target.constructor.name}.${String(prop)}`;
                const span     = tracer.startSpan(spanName, undefined, context.active());
                span.setAttribute('code.args', safeJson(methodArgs));

                try {
                    // run the original method in the new span context
                    const result = context.with(trace.setSpan(context.active(), span), () =>
                        original.apply(this, methodArgs),
                    );

                    // handle promise vs. sync return
                    if (result instanceof Promise) {
                        return result
                            .then((data) => {
                                span.setAttribute('code.result', safeJson(data));
                                return data;
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
