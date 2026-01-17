const express = require("express");
const router = express.Router();
const usuarios = require("../models/usuarioCorreos");


// Registro de usuarios
router.post("/registro", async (req, res) => {
  const { correo } = req.body;

  // Inicia validacion para no registrar usuarios con el mismo correo electronico
  const busqueda = await usuarios.findOne({ correo });

  if (busqueda && busqueda.correo === correo) {
    return res.status(401).json({ mensaje: "Correo ya registrado" });
  } else {
    try {
      const usuarioRegistrar = usuarios({
        ...req.body
      });

      await usuarioRegistrar.save()
        .then((data) =>
          res.status(200).json({ mensaje: "Registro exitoso del usuario" })
        )
        .catch((error) => res.json({ message: error }));
    } catch (error) {
      res.status(500).json({ message: "Error en el registro del usuario" });
    }
  }
});

// Obtener todos los usuarios colaboradores
router.get("/listar", async (req, res) => {
  await usuarios
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los usuarios registrados
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await usuarios
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de socios sindicalizados
router.get("/total", async (req, res) => {
  await usuarios
    .find()
    .countDocuments()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un usuario en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await usuarios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un usuario administrador
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await usuarios
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "Usuario eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Deshabilitar el usuario
router.put("/deshabilitar/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  await usuarios
    .updateOne({ _id: id }, { $set: { estado } })
    .then((data) =>
      res.status(200).json({ mensaje: "Estado del usuario actualizado" })
    )
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const {
    correo,
    password
  } = req.body;

  try {

    const updateData = {
      correo,
      password
    };

    await usuarios.updateOne(
      { _id: id },
      { $set: updateData }
    )
      .then((data) => res.status(200).json({ mensaje: "Datos actualizados" }))
      .catch((error) => res.json({ message: error }));
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar los datos" });
  }
});

module.exports = router;
