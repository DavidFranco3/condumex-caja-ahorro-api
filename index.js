const Sentry = require("@sentry/node");
const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

require("./src/database");

const file = path.join(__dirname, "favicon.ico");

const notFound = require("./src/middleware/notFound");
const handleErrors = require("./src/middleware/handleErrors");
const { verifyToken } = require("./src/middleware/verifyToken");

// Configuración del servidor
const app = express();

// Initialize Sentry (API moderna)
Sentry.init({
  dsn: "https://34cda94143a14ff3938078498a0bc8e4@o1301469.ingest.sentry.io/6538433",
  tracesSampleRate: 1.0, // captura 100% de performance
});

// Captura errores no manejados
process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  Sentry.captureException(err);
  console.error("Unhandled Rejection:", err);
});

// Middlewares básicos
app.use(morgan("dev"));
app.use(express.json());
app.use(favicon(file));
app.use(cors());

// CORS configuration extra
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, responseType, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Rutas principales
app.get("/", (_req, res) => {
  return res.status(200).json({
    mensaje: "API para administración de la Caja de Ahorro de Condumex",
  });
});

// Rutas protegidas
app.use(require("./src/routes/login.routes"));
app.use("/usuarios/", verifyToken, require("./src/routes/usuarios.routes"));
app.use("/empleados/", verifyToken, require("./src/routes/empleados.routes"));
app.use("/sindicalizados/", verifyToken, require("./src/routes/sindicalizados.routes"));
app.use("/sociosEspeciales/", verifyToken, require("./src/routes/sociosEspeciales.routes"));
app.use("/infoRespaldosAutomaticos/", require("./src/routes/infoRespaldosAutomaticos.routes"));
app.use("/correos/", verifyToken, require("./src/routes/correos.routes"));
app.use("/aportaciones/", verifyToken, require("./src/routes/aportaciones.routes"));
app.use("/bajaSocios/", verifyToken, require("./src/routes/bajaSocios.routes"));
app.use("/prestamos/", verifyToken, require("./src/routes/prestamos.routes"));
app.use("/abonos/", verifyToken, require("./src/routes/abonos.routes"));
app.use("/deudaSocio/", verifyToken, require("./src/routes/deudaSocio.routes"));
app.use("/parametros/", verifyToken, require("./src/routes/parametros.routes"));
app.use("/retiros/", verifyToken, require("./src/routes/retiros.routes"));
app.use("/periodos/", verifyToken, require("./src/routes/periodos.routes"));
app.use("/movimientosSaldos/", verifyToken, require("./src/routes/movimientosSaldos.routes"));
app.use("/saldos/", verifyToken, require("./src/routes/saldoSocios.routes"));
app.use("/saldosGlobales", verifyToken, require("./src/routes/saldosGlobales.routes"));
app.use("/rendimientos", verifyToken, require("./src/routes/rendimientos.routes"));
app.use("/patrimonio", verifyToken, require("./src/routes/patrimonio.routes"));
app.use("/statements", require("./src/routes/statements.routes"));

// Error handling middleware
app.use(notFound);
app.use(handleErrors);

// Start server
const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
