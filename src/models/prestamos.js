const mongoose = require("mongoose");
const { Schema } = mongoose;

const prestamos = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    prestamo: { type: mongoose.Decimal128, required: true },
    prestamoTotal: { type: mongoose.Decimal128, required: true },
    tasaInteres: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

prestamos.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.prestamo = Number(returnedObject.prestamo);
    returnedObject.prestamoTotal = Number(returnedObject.prestamoTotal);
    returnedObject.tasaInteres = Number(returnedObject.tasaInteres);
    returnedObject.fechaCreacion =
    returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Prestamos", prestamos, "Prestamos");
