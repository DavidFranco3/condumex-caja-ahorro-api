const mongoose = require("mongoose");
const { Schema } = mongoose;

const usuarioCorreos = new Schema(
  {
    correo: { type: String },
    password: { type: String },
  },
  {
    timestamps: true,
  }
);

usuarioCorreos.set("toJSON", {
  transform: (_document, returnedObject) => {
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("UsuarioCorreos", usuarioCorreos, "UsuarioCorreos");
