const mongoose = require("mongoose");
const { Schema } = mongoose;

const saldosSocios = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    aportacion: { type: mongoose.Decimal128, required: true },
    patrimonio: { type: mongoose.Decimal128, required: true },
    rendimiento: { type: mongoose.Decimal128, required: true },
    folioMovimiento: { type: Number, required: true },
    movimiento: { type: String },
  },
  {
    timestamps: true,
  }
);

saldosSocios.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.rendimiento = Number(returnedObject.rendimiento);
    returnedObject.patrimonio = Number(returnedObject.patrimonio);
    returnedObject.aportacion = Number(returnedObject.aportacion);
    returnedObject.folioMovimiento = Number(returnedObject.folioMovimiento);
    returnedObject.movimiento = returnedObject.movimiento;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("SaldosSocios", saldosSocios, "SaldosSocios");
