const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const infoRespaldosAutomaticos = require("../models/infoRespaldosAutomaticos");

// Registro de informacion de respaldos automaticos
router.post("/registro", verifyToken, async (req, res) => {
  const { ficha } = req.body;

  // Inicia validacion para no registrar informacion de respaldos automaticos con el mismo folio
  const busqueda = await infoRespaldosAutomaticos.findOne({ ficha });

  if (busqueda && busqueda.ficha === ficha) {
    return res.status(401).json({
      mensaje: "Ya existe información de respaldo automático con este folio",
    });
  } else {
    const infoRespaldosAutomaticosRegistrar = infoRespaldosAutomaticos(
      req.body
    );
    await infoRespaldosAutomaticosRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso de la información" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener el numero total de registros de informacion de respaldos automaticos
router.get("/total", verifyToken, async (req, res) => {
  await infoRespaldosAutomaticos
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los informacion de respaldos automaticos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await infoRespaldosAutomaticos
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", verifyToken, async (req, res) => {
  const registroinfoRespaldosAutomaticos = await infoRespaldosAutomaticos
    .find()
    .count();
  if (registroinfoRespaldosAutomaticos === 0) {
    res.status(200).json({ folio: "1" });
  } else {
    const ultimo = await infoRespaldosAutomaticos.findOne().sort({ _id: -1 });
    const tempFolio = parseInt(ultimo.folio) + 1;
    res.status(200).json({ folio: tempFolio.toString() });
  }
});

// Obtener informacion de respaldos automaticos en especifico
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  await infoRespaldosAutomaticos
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener informacion de respaldos automaticos segun el numero de ficha
router.get("/obtenerxFolio/:folio", verifyToken, async (req, res) => {
  const { folio } = req.params;

  await infoRespaldosAutomaticos
    .findOne({ folio })
    .then((data) => res.json(data))
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
