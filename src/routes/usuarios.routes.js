const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { jwtDecode } = require("jwt-decode");
const usuarios = require("../models/usuarios");
const bcrypt = require("bcrypt");

// Registro de usuarios
router.post("/registro", async (req, res) => {
  const { correo, password } = req.body;
  console.log(correo, password)

  // Inicia validacion para no registrar usuarios con el mismo correo electronico
  const busqueda = await usuarios.findOne({ correo });

  if (busqueda && busqueda.correo === correo) {
    return res.status(401).json({ mensaje: "Correo ya registrado" });
  } else {
    try {
      // Hash the password
      console.log("hola")
      const hashedPassword = await bcrypt.hash(password, 10);

      const usuarioRegistrar = usuarios({
        ...req.body,
        password: hashedPassword
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

// Obtener el número total de usuarios
router.get("/total", async (_req, res) => {
  try {
    const totalUsuarios = await usuarios.countDocuments();
    res.json(totalUsuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el total de usuarios" });
  }
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
    correo,
    password
  } = req.body;

  try {
    // Hash the password if it exists in the request
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updateData = {
      nombre,
      apellidos,
      correo,
    };

    // Only add password if it's provided
    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

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
