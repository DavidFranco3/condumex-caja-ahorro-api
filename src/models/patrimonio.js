const mongoose = require("mongoose");
const { Schema } = mongoose;

const patrimonio = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    patrimonio: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

patrimonio.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.patrimonio = Number(returnedObject.patrimonio);
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Patrimonio", patrimonio, "Patrimonio");
