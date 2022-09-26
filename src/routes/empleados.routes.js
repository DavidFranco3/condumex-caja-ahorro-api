const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const empleados = require("../models/empleados");

// Registro de empleados
router.post("/registro", verifyToken, async (req, res) => {
  const { ficha } = req.body;

  // Inicia validacion para no registrar empleados con el mismo numero de ficha
  const busqueda = await empleados.findOne({ ficha });

  if (busqueda && busqueda.ficha === ficha) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un socio con este numero de ficha" });
  } else {
    const empleadosRegistrar = empleados(req.body);
    await empleadosRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso del socio" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los empleados
router.get("/listar", verifyToken, async (req, res) => {
  await empleados
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de empleados
router.get("/total", verifyToken, async (req, res) => {
  await empleados
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los empleados
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await empleados
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de ficha actual
router.get("/obtenerFicha", verifyToken, async (req, res) => {
  const registroempleados = await empleados.find().count();
  if (registroempleados === 0) {
    res.status(200).json({ ficha: "1" });
  } else {
    const ultimo = await empleados.findOne().sort({ _id: -1 });
    const tempFolio = parseInt(ultimo.ficha) + 1;
    res.status(200).json({ ficha: tempFolio.toString() });
  }
});

// Obtener un empleado en especifico
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  await empleados
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un empleado segun el numero de ficha
router.get("/obtenerxFicha/:ficha", verifyToken, async (req, res) => {
  const { ficha } = req.params;

  await empleados
    .find({ ficha: parseInt(ficha) })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un empleado segun el numero de ficha
router.get("/obtenerNombrexFicha/:ficha", verifyToken, async (req, res) => {
  const { ficha } = req.params;

  await empleados
    .findOne({ ficha: parseInt(ficha) })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Buscar coincidencias en nombre
router.get("/obtenerxCoincidenciasNombre/:coincidencia", verifyToken, async (req, res) => {
    const { coincidencia } = req.params;
    console.log(coincidencia);
    await empleados
      .find({ $or: [{ nombre: /sinecio/i }] })
      .then((data) => res.json(data))
      .catch((error) => res.json({ message: error }));
  }
);

// route to get the empleado by tipo and nombre
router.get("/obtenerByNombre", verifyToken, async (req, res) => {
  const { nombre } = req.query;
  await empleados
    .find({
      $and: [
        { estado: { $eq: "true" } },
        { nombre: { $regex: nombre, $options: "i" } },
      ],
    })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un empleado
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await empleados
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "Socio eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Deshabilitar un empleado
router.put("/deshabilitar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  await empleados
    .updateOne({ _id: id }, { $set: { estado } })
    .then((data) =>
      res.status(200).json({ mensaje: "Estado del socio actualizado" })
    )
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del empleado
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, tipoSocio, correo, ficha } = req.body;
  await empleados
    .updateOne({ _id: id }, { $set: { nombre, tipoSocio, correo, ficha } })
    .then((data) =>
      res.status(200).json({ mensaje: "Datos del socio actualizados" })
    )
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo/:fecha", verifyToken, async (req, res) => {
  const { fecha } = req.params;
  await empleados
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Socios eliminados" }))
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
