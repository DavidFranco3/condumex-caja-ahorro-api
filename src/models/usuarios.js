const mongoose = require("mongoose");
const { Schema } = mongoose;

const usuarios = new Schema(
  {
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    telefonoCelular: { type: String, required: true },
    correo: { type: String, required: true },
    password: { type: String, required: true },
    estado: { type: String },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

usuarios.set("toJSON", {
  transform: (_document, returnedObject) => {
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Usuarios", usuarios, "Usuarios");
