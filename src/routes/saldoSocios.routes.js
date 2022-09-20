const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const saldoSocios = require("../models/saldosSocios");

// Registro de saldo de socios
router.post("/registro", verifyToken, async (req, res) => {
  const { fichaSocio } = req.body;

  // Inicia validación para no hacer duplicación en registro de saldo de socios
  const busqueda = await saldoSocios.findOne({ fichaSocio });

  if (busqueda && busqueda.fichaSocio === fichaSocio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un registro de saldos para este socio" });
  } else {
    const saldoSociosRegistrar = saldoSocios(req.body);
    await saldoSociosRegistrar
      .save()
      .then((data) =>
        res.status(200).json({
          mensaje: "Registro exitoso de saldos iniciales de los socios",
        })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los saldos de los socios
router.get("/listar", verifyToken, async (req, res) => {
  await saldoSocios
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el número total de registros de saldos de socios
router.get("/total", verifyToken, async (req, res) => {
  await saldoSocios
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo/:tipo", verifyToken, async (req, res) => {
  const { tipo } = req.params;
  await saldoSocios
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los saldos de los socios
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await saldoSocios
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

  await saldoSocios
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el número de folio actual
router.get("/obtenerFolioActual", verifyToken, async (req, res) => {
  const registrosaldoSocios = await saldoSocios.find().count();
  if (registrosaldoSocios === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimo] = await saldoSocios.find({}).sort({ folio: -1 }).limit(1);
    const tempFolio = ultimo.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener los datos del saldo del socio por id de bd
router.get("/obtener/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  await saldoSocios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener los datos del saldo del socio por ficha del socio
router.get("/obtenerxFichaSocio/:fichaSocio", verifyToken, async (req, res) => {
  const { fichaSocio } = req.params;

  await saldoSocios
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un registro de saldos de socios --
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await saldoSocios
    .deleteOne({ _id: id })
    .then((data) =>
      res.status(200).json({ mensaje: "Saldos y ultimo movimiento eliminado" })
    )
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del saldo de socios
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { aportacion, patrimonio, rendimiento, folioMovimiento, movimiento } =
    req.body;
  await saldoSocios
    .updateOne(
      { _id: id },
      { $set: { aportacion, patrimonio, rendimiento, folioMovimiento, movimiento } }
    )
    .then((data) =>
      res.status(200).json({ mensaje: "Saldos del socio actualizados" })
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
