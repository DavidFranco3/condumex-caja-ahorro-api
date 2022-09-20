const express = require("express");
const router = express.Router();
const aportaciones = require("../models/aportaciones");

router.get("/totalGeneralBySocio", async (req, res) => {
  // get fecha and razon social by req.query
  const { ficha } = req.query;

  // validate fecha and razon social
  if (!ficha) {
    return res.status(400).json({
      message: "Falta fIcha del socio",
    });
  }

  try {
    const result = await aportaciones.aggregate([
      {
        $match: {
          fichaSocio: ficha,
        },
      },
      {
        $group: {
          _id: "$fichaSocio",
          total: { $sum: { $toDecimal: "$aportacion" } },
        },
      },
    ]);

    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({
      message: `Error al obtener total general para la fecha ${fecha} y razon social ${razonSocial}`,
    });
  }
});

// Obtener todas las aportaciones acumuladas por tipo
router.get("/acumuladoByRazonSocial", async (req, res) => {
  const { tipo } = req.query;

  if (!tipo) {
    return res.status(400).json({
      message: "La razón social es requerida",
    });
  }

  try {
    const result = await aportaciones.aggregate([
      {
        $match: { tipo: { $eq: tipo } },
      },
      {
        $group: {
          _id: "$tipo",
          aportacion: { $sum: { $toDecimal: "$aportacion" } },
        },
      },
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay aportaciones acumuladas",
        tipo,
        aportaciones: 0,
      });
    } else {
      const [item] = result;
      const { aportacion, _id } = item;

      res.json({ _id, aportaciones: Number(aportacion) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las aportaciones acumuladas por razón social",
    });
  }
});

// Obtener todas las aportaciones por ficha del socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida",
    });
  }

  try {
    const result = await aportaciones.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => {
      return acc + Number(cur.aportacion);
    }, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay aportaciones para este socio",
        ficha,
        aportaciones: [],
        total,
      });
    } else {
      res.json({ aportaciones: result, total });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las aportaciones por ficha del socio",
    });
  }
});

router.get("/acumuladoByTipo", async (req, res) => {
  const { tipo } = req.query;

  try {
    const result = await aportaciones.aggregate([
      {
        $match: { tipo: { $eq: tipo } },
      },
      {
        $group: {
          _id: "$fichaSocio",
          aportacion: { $sum: { $toDecimal: "$aportacion" } },
        },
      },
    ]);

    return res.json({
      aportaciones: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener las aportaciones acumuladas",
      error,
    });
  }
});

// Registro de aportaciones
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar aportaciones con el mismo numero de folio
  const busqueda = await aportaciones.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una aportacion con este numero de folio" });
  } else {
    const aportacionesRegistrar = aportaciones(req.body);
    await aportacionesRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso de la aportacion" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Registro de aportaciones
router.post("/registro2", async (req, res) => {
  const { fichaSocio } = req.body;

  // Inicia validacion para no registrar aportaciones con el mismo numero de folio
  const busqueda = await aportaciones.findOne({ fichaSocio });

  if (busqueda && busqueda.fichaSocio === fichaSocio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una aportacion con este numero de folio" });
  } else {
    const aportacionesRegistrar = aportaciones(req.body);
    await aportacionesRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso de la aportacion" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los aportaciones
router.get("/listar", async (_req, res) => {
  const { tipo, inicio, fin } = _req.query;
    await aportaciones
    .find({ tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') } })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de aportaciones
router.get("/numeroAportaciones", async (_req, res) => {
  await aportaciones
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await aportaciones
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los aportaciones
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await aportaciones
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

  await aportaciones
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (_req, res) => {
  const registroaportaciones = await aportaciones.find().count();

  if (registroaportaciones === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimaAportacion] = await aportaciones
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimaAportacion.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener una aportacion en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  await aportaciones
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await aportaciones
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar una aportacion
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await aportaciones
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Aportación eliminada" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos de la aportacion
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const { aportacion: cash, createdAt } = req.body;

  // find patrimonio by id
  const result = await aportaciones.findById(id);

  if (!result) {
    res.status(404).json({ message: "aportacion no encontrada" });
  }

  // update result
  await aportaciones
    .findByIdAndUpdate(id, {
      $set: {
        aportacion: cash,
        createDate: createdAt,
      },
    })
    .then((data) => res.json({ data, message: "Aportacion actualizada" }))
    .catch((error) => res.json({ message: error }));
});

// Borrar muchas aportaciones
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await aportaciones
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Aportaciones eliminadas" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
