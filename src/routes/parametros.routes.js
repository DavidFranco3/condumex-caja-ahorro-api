const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const parametros = require("../models/parametros");

// Registro de parametros
router.post("/registro", verifyToken, async (req, res) => {
  const parametrosRegistrar = parametros(req.body);
  await parametrosRegistrar
    .save()
    .then((data) =>
      res
        .status(200)
        .json({ mensaje: "Registro exitoso de los parametros", datos: data })
    )
    .catch((error) => res.json({ message: error }));
});

// Obtener todos los parametros
router.get("/listar", verifyToken, async (req, res) => {
  await parametros
    .find()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de parametros
router.get("/numeroParametros", verifyToken, async (req, res) => {
  await parametros
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los parametros
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await parametros
    .find()
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar los parametros
router.delete("/eliminar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await parametros
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "Parámetros eliminados" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar parámetros
router.put("/actualizar/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    tasaInteres,
    inicioPeriodoSyE,
    inicioPeriodoContabilidad,
    inicioPeriodoPeregrinacion,
    finPeriodoSyE,
    finPeriodoContabilidad,
    finPeriodoPeregrinacion,
    fechaEnvioEstadosCuenta,
    fechaAporteEmpleados,
    fechaAporteSindicalizados,
  } = req.body;
  await parametros
    .updateOne(
      { _id: id },
      {
        $set: {
          tasaInteres,
          inicioPeriodoSyE,
          inicioPeriodoContabilidad,
          inicioPeriodoPeregrinacion,
          finPeriodoSyE,
          finPeriodoContabilidad,
          finPeriodoPeregrinacion,
          fechaEnvioEstadosCuenta,
          fechaAporteEmpleados,
          fechaAporteSindicalizados,
        },
      }
    )
    .then((data) =>
      res.status(200).json({ mensaje: "Parametros actualizados" })
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
