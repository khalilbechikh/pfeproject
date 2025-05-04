import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { configureRoutes } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import cors from 'cors';

// === OpenTelemetry Tracing Setup ===
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// === OpenTelemetry Metrics Setup (v2.x) ===
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

// --- Tracing ---
const traceExporter = new OTLPTraceExporter({
  url: 'http://otel-collector:4318/v1/traces',  // ✅ Correct: Docker Compose service name
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('✅ OpenTelemetry tracing initialized');

// --- Metrics ---
const metricExporter = new OTLPMetricExporter({
  url: 'http://otel-collector:4318/v1/metrics',  // ✅ Correct: Docker Compose service name
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000, // every 60 seconds
});

const meterProvider = new MeterProvider({
  readers: [metricReader],
});

console.log('✅ OpenTelemetry metrics initialized');

// === Express App ===
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome User Management API! Use /api routes to access the API.');
});
app.use('/uploads/avatars', express.static('uploads/avatars'));

// Configure and mount API routes
app.use('/v1/api', configureRoutes());

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📄 API Docs at http://localhost:${port}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sdk.shutdown();
  process.exit(0);
});

export default app;
