const mongoose = require("mongoose");
const { Schema } = mongoose;

const sociosEspeciales = new Schema(
  {
    ficha: { type: Number, required: true },
    nombre: { type: String, required: true },
    tipo: { type: String, required: true },
    correo: { type: String, required: true },
    estado: { type: String, required: true},
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

sociosEspeciales.set("toJSON", {
  transform: (_document, returnedObject) => {
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("SociosEspeciales", sociosEspeciales, "SociosEspeciales");
