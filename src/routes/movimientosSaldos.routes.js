const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const saldosSocios = require("../models/movimientosSaldos");

// Registro de saldosSocios
router.post("/registro", verifyToken, async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar saldosSocios con el mismo numero de folio
  const busqueda = await saldosSocios.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un movimiento con este numero de folio" });
  } else {
    const saldosSociosRegistrar = saldosSocios(req.body);
    await saldosSociosRegistrar
      .save()
      .then((data) =>
        res
          .status(200)
          .json({ mensaje: "Registro exitoso del movimiento", datos: data })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los saldos de socios
router.get("/listar", verifyToken, async (_req, res) => {
  await saldosSocios
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de saldos de socios
router.get("/numeroMovimientos", verifyToken, async (_req, res) => {
  await saldosSocios
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", verifyToken, async (req, res) => {
  const { tipo } = req.query;
  await saldosSocios
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los saldos de socios
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await saldosSocios
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando, indicando el tipo, el cual es la razon social
router.get("/listarPaginandoxTipo", async (req, res) => {
  const { pagina, limite, tipo } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await saldosSocios
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio
router.get("/obtenerFolio", verifyToken, async (_req, res) => {
  const registrosaldosSocios = await saldosSocios.find().count();
  if (registrosaldosSocios === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoMovimiento] = await saldosSocios
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimoMovimiento.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un movimiento en especifico
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await saldosSocios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener los movimientos de el socio solicitado
router.get("/obtenerxFicha/:fichaSocio", verifyToken, async (req, res) => {
  const { fichaSocio } = req.params;

  await saldosSocios
    .find({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un movimiento
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await saldosSocios
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Movimiento eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del movimiento
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { aportacion, prestamo, patrimonio, rendimiento, retiro, movimiento } = req.body;
  await saldosSocios
    .updateOne(
      { _id: id },
      { $set: { aportacion, prestamo, patrimonio, rendimiento, retiro, movimiento } }
    )
    .then((_data) =>
      res.status(200).json({ mensaje: "Movimientos actualizados" })
    )
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

  return timeout < 0;
}

module.exports = router;
