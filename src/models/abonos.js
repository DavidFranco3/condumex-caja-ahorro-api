const mongoose = require("mongoose");
const { Schema } = mongoose;

const abonos = new Schema(
  { 
    fichaSocio: { type: Number, required: true },
    folio: { type: Number, required: true },
    tipo: { type: String, required: true },
    abono: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

abonos.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.abono = Number(returnedObject.abono);
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;
    
    
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Abonos", abonos, "Abonos");
