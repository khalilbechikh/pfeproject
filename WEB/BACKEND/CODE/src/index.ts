import 'reflect-metadata';

/* ──────────── OpenTelemetry bootstrap (BEFORE Express) ──────────── */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes as SRA } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation, ExpressRequestInfo } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { Span } from '@opentelemetry/api';

/* === Resource descriptor === */
const resource = resourceFromAttributes({
  [SRA.SERVICE_NAME]: 'backend',
  [SRA.SERVICE_VERSION]: '1.0.0',
  'deployment.environment': process.env.NODE_ENV ?? 'development',
});

/* === Exporters === */
const traceExporter = new OTLPTraceExporter({
  url: 'http://otel-collector:4318/v1/traces',
});
const metricExporter = new OTLPMetricExporter({
  url: 'http://otel-collector:4318/v1/metrics',
});

/* === Metric reader === */
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60_000,
});

/* === HTTP & Express instrumentation with rich hooks === */
const expressInstr = new ExpressInstrumentation({
  spanNameHook: (info: ExpressRequestInfo): string => {
    const method = (info.request as any)?.method ?? '';
    return `${method} ${info.route}`;
  },
  requestHook(span: Span, info: ExpressRequestInfo): void {
    const req = info.request as import('express').Request;
    span.setAttribute('http.request.headers', JSON.stringify(req.headers));
    span.setAttribute('http.req.query', JSON.stringify(req.query));
    span.setAttribute('http.req.params', JSON.stringify(req.params));

    if (req.body && Object.keys(req.body).length > 0) {
      span.setAttribute('http.request.body', JSON.stringify(req.body).slice(0, 4_096));
    }
  },
});

const httpInstr = new HttpInstrumentation();
const prismaInstr = new PrismaInstrumentation();

/* === Build & start the SDK (sync in SDK v2) === */
export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [
    httpInstr,
    expressInstr,
    prismaInstr,
    getNodeAutoInstrumentations(), // DB & other libraries
  ],
});

/* ──────────── Express-related imports (AFTER OTEL init code) ──────────── */
import express, { Request, Response, NextFunction } from 'express';
import { trace } from '@opentelemetry/api';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import cors from 'cors';

async function main() {
  try {
    otelSDK.start();
    console.log('✅ OpenTelemetry tracing & metrics initialized');
  } catch (err) {
    console.error('❌ OpenTelemetry failed to initialize:', err);
  }

  /* ──────────── Express application (AFTER SDK.start()) ──────────── */
  const tracer = trace.getTracer('backend');
  const app = express();

  // CORS configuration
  const corsOptions = {
    origin: 'http://localhost:5173', // Explicit origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
  };

  app.use(cors(corsOptions));

  const port = process.env.PORT || 5000;

  /* Body parsers */
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  /* Pipeline‑wide span for each request */
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
  app.use('/uploads/avatars', express.static('uploads/avatars'));

  /* Swagger & feature routes */
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/v1/api', configureRoutes());

  /* Start server */
  const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📄 API Docs     at http://localhost:${port}/api-docs`);
  });

  /* Graceful shutdown */
  async function shutdown() {
    console.log('Shutting down…');
    await otelSDK.shutdown();
    server.close(() => process.exit(0));
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Run the main function
main();
