const mongoose = require("mongoose");
const { Schema } = mongoose;

const empleados = new Schema(
  {
    ficha: { type: Number, required: true },
    nombre: { type: String, required: true },
    tipo: { type: String, required: true },
    correo: { type: String, required: true },
    estado: { type: String, required: true },
    createDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

empleados.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.ficha = returnedObject.ficha;
    returnedObject.nombre = returnedObject.nombre;
    returnedObject.tipo = returnedObject.tipo;
    returnedObject.correo = returnedObject.correo;
    returnedObject.estado = returnedObject.estado;
    returnedObject.fechaCreacion =
      returnedObject.createDate || returnedObject.createdAt;
    returnedObject.fechaActualizacion = returnedObject.updatedAt;
        
        delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Empleados", empleados, "Empleados");
