const mongoose = require("mongoose");
const { Schema } = mongoose;

const rendimientos = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    rendimiento: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

rendimientos.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.rendimiento = Number(returnedObject.rendimiento);
    returnedObject.fechaCreacion =
    returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Rendimientos", rendimientos, "Rendimientos");
