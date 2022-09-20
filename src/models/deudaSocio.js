const mongoose = require("mongoose");
const { Schema } = mongoose;

const deudaSocio = new Schema(
  { 
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    abonoTotal: { type: mongoose.Decimal128, required: true },
    prestamoTotal: { type: mongoose.Decimal128, required: true },
    movimiento: { type: String },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

deudaSocio.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.abonoTotal = Number(returnedObject.abonoTotal);
    returnedObject.prestamoTotal = Number(returnedObject.prestamoTotal);
    returnedObject.movimiento = returnedObject.movimiento;
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;
    
    
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("DeudaSocio", deudaSocio, "DeudaSocio");
