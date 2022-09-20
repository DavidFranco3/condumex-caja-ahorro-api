const express = require("express");
const router = express.Router();
const bajaSocios = require("../models/bajaSocios");

// Obtener todas las bajas por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida",
    });
  }

  try {
    const result = await bajaSocios.find({ fichaSocio: { $eq: ficha } });

    if (result.length === 0) {
      res.json({
        message: "No hay bajas registradas",
        bajas: [],
        total: 0,
      });
    } else {
      res.json({
        bajas: result,
        total: 0,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las bajas por socio",
    });
  }
});

// Registro de baja de socios
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar bajaSocios con el mismo numero de folio
  const busqueda = await bajaSocios.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una baja con este numero de folio" });
  } else {
    const bajaSociosRegistrar = bajaSocios(req.body);
    await bajaSociosRegistrar
      .save()
      .then((data) =>
        res
          .status(200)
          .json({ mensaje: "Registro exitoso de la baja del socio" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los registros de baja de socios
router.get("/listar", async (req, res) => {
  const { tipo, inicio, fin } = req.query;
    await bajaSocios
    .find( {tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') }} )
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de baja de socios
router.get("/numeroBajas", async (req, res) => {
  await bajaSocios
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await bajaSocios
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los registros de bajas de socios
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await bajaSocios
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

  await bajaSocios
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folcio actual
router.get("/obtenerFolio", async (req, res) => {
  const registrobajaSocios = await bajaSocios.find().count();
  if (registrobajaSocios === 0) {
    res.status(200).json({ folio: "1" });
  } else {
    const ultimaBaja = await bajaSocios.findOne().sort({ _id: -1 });
    const tempFolio = parseInt(ultimaBaja.folio) + 1;
    res.status(200).json({ folio: tempFolio.toString() });
  }
});

// Obtener una baja en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;

  await bajaSocios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener una baja segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await bajaSocios
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar una baja de socio
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await bajaSocios
    .deleteOne({ _id: id })
    .then((data) =>
      res.status(200).json({ mensaje: "Baja de socio eliminada" })
    )
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
