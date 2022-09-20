const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const saldosGlobales = require("../models/saldosGlobales");

// Registro de saldos globales
router.post("/registro", verifyToken, async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar saldosGlobales con el mismo numero de folio
  const busqueda = await saldosGlobales.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe registro de saldos con este folio" });
  } else {
    const saldosGlobalesRegistrar = saldosGlobales(req.body);
    await saldosGlobalesRegistrar
      .save()
      .then((data) =>
        res.status(200).json({
          mensaje: "Registro exitoso de los saldos globales",
          datos: data,
        })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los saldos
router.get("/listar", verifyToken, async (req, res) => {
  await saldosGlobales
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros
router.get("/total", verifyToken, async (req, res) => {
  await saldosGlobales
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los saldos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await saldosGlobales
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio
router.get("/obtenerFolio", verifyToken, async (req, res) => {
  const registrosaldosGlobales = await saldosGlobales.find().count();
  if (registrosaldosGlobales === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoMovimiento] = await saldosGlobales
      .find()
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimoMovimiento.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener indicando el id
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await saldosGlobales
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener los movimientos de el socio solicitado
router.get("/obtenerxFolio/:folio", verifyToken, async (req, res) => {
  const { folio } = req.params;

  await saldosGlobales
    .find({ folio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Eliminar el saldo --
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await saldosGlobales
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "Saldo eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del saldo
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { totalAportaciones, interesGenerado, deudaTotal, saldoFinal } =
    req.body;
  await saldosGlobales
    .updateOne(
      { _id: id },
      { $set: { totalAportaciones, interesGenerado, deudaTotal, saldoFinal } }
    )
    .then((data) =>
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

  if (timeout < 0) {
    return true;
  }
  return false;
}

module.exports = router;
