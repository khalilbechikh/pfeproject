import 'reflect-metadata';

/* ────────────  OpenTelemetry bootstrap (runs BEFORE Express) ──────────── */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes as SRA } from '@opentelemetry/semantic-conventions';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ExpressInstrumentation,
  ExpressRequestInfo,
} from '@opentelemetry/instrumentation-express';
import { Span } from '@opentelemetry/api';

/* === Resource === */
const resource = resourceFromAttributes({
  [SRA.SERVICE_NAME]:       'backend',
  [SRA.SERVICE_VERSION]:    '1.0.0',
  'deployment.environment': process.env.NODE_ENV ?? 'development',
});

/* === Exporters === */
const traceExporter  = new OTLPTraceExporter({  url: 'http://otel-collector:4318/v1/traces'  });
const metricExporter = new OTLPMetricExporter({ url: 'http://otel-collector:4318/v1/metrics' });

/* === Metric reader === */
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60_000,
});

/* === HTTP + Express instrumentation with custom hooks === */
const expressInstr = new ExpressInstrumentation({
  /* Better span names:   "GET /users/:id"  */
  spanNameHook: (info: ExpressRequestInfo, _defaultName: string): string => {
    const method = (info.request as any)?.method ?? '';
    return `${method} ${info.route}`;
  },

  /* Extra attributes on the Express layer span */
  requestHook(span: Span, info: ExpressRequestInfo): void {
    const req = info.request as import('express').Request;
    span.setAttribute('http.request.headers', JSON.stringify(req.headers));

    if (req.body && Object.keys(req.body).length > 0) {
      span.setAttribute(
        'http.request.body',
        JSON.stringify(req.body).slice(0, 4_096)           // truncate to 4 KB
      );
    }
  },
});

const httpInstr = new HttpInstrumentation();

/* === Build & start SDK (synchronous in 2.x) === */
export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    httpInstr,
    expressInstr,
    getNodeAutoInstrumentations(),    // keeps DB & other auto‑instrumentations
  ],
  metricReader,
});

otelSDK.start();
console.log('✅ OpenTelemetry tracing & metrics initialized');

/* ────────────  Express application (imports AFTER SDK.start()) ──────────── */
import express, { Request, Response, NextFunction } from 'express';
import { trace } from '@opentelemetry/api';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

const tracer = trace.getTracer('backend');
const app    = express();
const port   = Number(process.env.PORT) || 5000;

/* Body parsers (needed for requestHook to capture body) */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─ Custom middleware span that wraps the full request lifecycle ─ */
app.use((req: Request, res: Response, next: NextFunction) => {
  const span = tracer.startSpan('request.pipeline', {
    attributes: {
      'http.method': req.method,
      'http.target': req.originalUrl,
    },
  });

  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.setAttribute('http.response.headers', JSON.stringify(res.getHeaders()));
    span.end();
  });

  next();
});

/* Swagger & routes */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/v1/api', configureRoutes());

const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📄 API Docs     at http://localhost:${port}/api-docs`);
});

/* ────────────  Graceful shutdown ──────────── */
async function shutdown() {
  console.log('Shutting down…');
  await otelSDK.shutdown();   // flush telemetry
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

export default app;
