const mongoose = require("mongoose");
const { Schema } = mongoose;

const aportaciones = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    aportacion: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

aportaciones.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.aportacion = Number(returnedObject.aportacion);
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Aportaciones", aportaciones, "Aportaciones");
