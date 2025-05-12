import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';

/* ─────────── OpenTelemetry (SDK 2.x) ─────────── */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes as SRA } from '@opentelemetry/semantic-conventions';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

/* === Resource definition === */
const resource = resourceFromAttributes({
  [SRA.SERVICE_NAME]:       'backend',
  [SRA.SERVICE_VERSION]:    '1.0.0',
  'deployment.environment': process.env.NODE_ENV ?? 'development',
});

/* === Tracing === */
const traceExporter = new OTLPTraceExporter({
  url: 'http://otel-collector:4318/v1/traces',
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();                                   // start() is synchronous in SDK 2.x
console.log('✅ OpenTelemetry tracing initialized');

/* === Metrics === */
const metricExporter = new OTLPMetricExporter({
  url: 'http://otel-collector:4318/v1/metrics',
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60_000,
});

new MeterProvider({ resource, readers: [metricReader] });
console.log('✅ OpenTelemetry metrics initialized');

/* ─────────── Express app ─────────── */
const app  = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// Mount all API routes
app.use('/v1/api', configureRoutes());

const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📄 API Docs     at http://localhost:${port}/api-docs`);
});

/* === Graceful shutdown === */
async function shutdown() {
  console.log('Shutting down…');
  await sdk.shutdown();                         // flush telemetry
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

export default app;
