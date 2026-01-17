const express = require("express");
const router = express.Router();
const periodos = require("../models/periodos");

// Registro de periodos
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar periodos con el mismo folio
  const busqueda = await periodos.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un periodo con este folio" });
  } else {
    const periodosRegistrar = periodos(req.body);
    await periodosRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso del periodo" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los periodos
router.get("/listarPeriodos", async (req, res) => {
  const { tipo } = req.query;
  await periodos
    .find({ tipo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de periodos
router.get("/numeroPeriodos", async (req, res) => {
  await periodos
    .countDocuments()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await periodos
    .find({ tipo })
    .countDocuments()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los periodos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await periodos
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

  await periodos
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (_req, res) => {
  try {
    const registroperiodos = await periodos.countDocuments();
    console.log(registroperiodos);

    if (registroperiodos === 0) {
      return res.status(200).json({ folio: 1 });
    }

    const ultimoPeriodo = await periodos
      .findOne({})
      .sort({ folio: -1 });

    const tempFolio = ultimoPeriodo.folio + 1;

    res.status(200).json({ folio: tempFolio });

  } catch (error) {
    console.error("Error obtenerFolio periodos:", error);
    res.status(500).json({ message: "Error al obtener folio" });
  }
});

// Obtener un periodo en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await periodos
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un periodo
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await periodos
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "periodo eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, fechaInicio, fechaCierre } =
    req.body;
  await periodos
    .updateOne(
      { _id: id },
      { $set: { nombre, fechaInicio, fechaCierre } }
    )
    .then((data) =>
      res.status(200).json({ mensaje: "Periodo actualizado" })
    )
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
