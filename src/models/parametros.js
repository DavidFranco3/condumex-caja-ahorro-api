const mongoose = require("mongoose");
const { Schema } = mongoose;

const parametros = new Schema(
  {
    tasaInteres: { type: mongoose.Decimal128, required: true },
    inicioPeriodoSyE: { type: String },
    inicioPeriodoContabilidad: { type: String },
    inicioPeriodoPeregrinacion: { type: String },
    finPeriodoSyE: { type: String },
    finPeriodoContabilidad: { type: String },
    finPeriodoPeregrinacion: { type: String },
    fechaEnvioEstadosCuenta: { type: String },
    fechaAporteEmpleados: { type: String },
    fechaAporteSindicalizados: { type: String },
  },
  {
    timestamps: true,
  }
);

parametros.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.tasaInteres = Number(returnedObject.tasaInteres);

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Parametros", parametros, "Parametros");
