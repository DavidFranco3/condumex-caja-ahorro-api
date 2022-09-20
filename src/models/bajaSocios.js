const mongoose = require("mongoose");
const { Schema } = mongoose;

const bajaSocios = new Schema(
  {
    folio: { type: Number, required: true },
    fichaSocio: { type: Number, required: true },
    tipo: { type: String, required: true },
    aportacion: { type: mongoose.Decimal128, required: true },
    patrimonio: { type: mongoose.Decimal128, required: true },
    rendimiento: { type: mongoose.Decimal128, required: true },
    total: { type: mongoose.Decimal128, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

bajaSocios.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.rendimiento = Number(returnedObject.rendimiento);
    returnedObject.patrimonio = Number(returnedObject.patrimonio);
    returnedObject.aportacion = Number(returnedObject.aportacion);
    returnedObject.total = Number(returnedObject.total);
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;

    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("BajaSocios", bajaSocios, "BajaSocios");
