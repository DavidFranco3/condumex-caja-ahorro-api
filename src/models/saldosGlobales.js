const mongoose = require("mongoose");
const { Schema } = mongoose;

const saldosGlobales = new Schema(
  {
    folio: { type: Number, required: true },
    totalAportaciones: { type: mongoose.Decimal128, required: true },
    interesGenerado: { type: mongoose.Decimal128, required: true },
    deudaTotal: { type: mongoose.Decimal128, required: true },
    saldoFinal: { type: mongoose.Decimal128, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SaldosGlobales", saldosGlobales, "SaldosGlobales");
