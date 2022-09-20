const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const usuarios = require("../models/usuarios");

// Registro de usuarios
router.post("/registro", async (req, res) => {
  const { correo } = req.body;

  // Inicia validacion para no registrar usuarios con el mismo correo electronico
  const busqueda = await usuarios.findOne({ correo });

  if (busqueda && busqueda.correo === correo) {
    return res.status(401).json({ mensaje: "Correo ya registrado" });
  } else {
    const usuarioRegistrar = usuarios(req.body);
    await usuarioRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso del usuario" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los usuarios colaboradores
router.get("/listar", verifyToken, async (req, res) => {
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

// Obtener un usuario en especifico
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await usuarios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un usuario administrador
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await usuarios
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "Usuario eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Deshabilitar el usuario
router.put("/deshabilitar/:id", verifyToken, async (req, res) => {
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
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellidos,
    curp,
    nss,
    rfc,
    telefonoCelular,
    telefonoFijo,
    direccion,
    departamento,
    fechaIngreso,
    correo,
    password,
    foto,
  } = req.body;
  await usuarios
    .updateOne(
      { _id: id },
      {
        $set: {
          nombre,
          apellidos,
          curp,
          nss,
          rfc,
          telefonoCelular,
          telefonoFijo,
          direccion,
          departamento,
          fechaIngreso,
          correo,
          password,
          foto,
        },
      }
    )
    .then((data) => res.status(200).json({ mensaje: "Datos actualizados" }))
    .catch((error) => res.json({ message: error }));
});

async function verifyToken(req, res, next) {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({ mensaje: "Petición no Autorizada" });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (token === "null") {
      return res.status(401).send({ mensaje: "Petición no Autorizada" });
    }

    const payload = await jwt.verify(token, "secretkey");
    if (await isExpired(token)) {
      return res.status(401).send({ mensaje: "Token Invalido" });
    }
    if (!payload) {
      return res.status(401).send({ mensaje: "Petición no Autorizada" });
    }
    req._id = payload._id;
    next();
  } catch (e) {
    // console.log(e)
    return res.status(401).send({ mensaje: "Petición no Autorizada" });
  }
}

async function isExpired(token) {
  const { exp } = jwtDecode(token);
  const expire = exp * 1000;
  const timeout = expire - Date.now();

  if (timeout < 0) {
    return true;
  }
  return false;
}

module.exports = router;
