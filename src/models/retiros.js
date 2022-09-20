const mongoose = require("mongoose");
const { Schema } = mongoose;

const retiros = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    retiro: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

retiros.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.retiro = Number(returnedObject.retiro);
        returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Retiros", retiros, "Retiros");
