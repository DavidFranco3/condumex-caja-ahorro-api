const mongoose = require("mongoose");
const { Schema } = mongoose;

const movimientosSaldos = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    aportacion: { type: mongoose.Decimal128, required: true },
    prestamo: { type: mongoose.Decimal128, required: true },
    patrimonio: { type: mongoose.Decimal128, required: true },
    rendimiento: { type: mongoose.Decimal128, required: true },
    retiro: { type: mongoose.Decimal128, required: true },
    abono: { type: mongoose.Decimal128, required: true },
    movimiento: { type: String, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

movimientosSaldos.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.abono = Number(returnedObject.abono);
    returnedObject.aportacion = Number(returnedObject.aportacion);
    returnedObject.prestamo = Number(returnedObject.prestamo);
    returnedObject.patrimonio = Number(returnedObject.patrimonio);
    returnedObject.rendimiento = Number(returnedObject.rendimiento);
    returnedObject.retiro = Number(returnedObject.retiro);
    returnedObject.movimiento = returnedObject.movimiento;
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("MovimientosSaldos", movimientosSaldos, "MovimientosSaldos");
