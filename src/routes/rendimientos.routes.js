const express = require("express");
const router = express.Router();
const rendimientos = require("../models/rendimientos");

const endPeriodoAportacion = (date) => {
  const tmp = new Date(date);

  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(28);
  
  return tmp;
};

// Obtener los datos del saldo del socio por ficha del socio
router.get("/obtenerRendimientoxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await rendimientos
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

router.get("/totalGeneralByRazon", async (req, res) => {
  // get fecha and razon social by req.query
  const { fecha, razonSocial } = req.query;

  // validate fecha and razon social
  if (!fecha || !razonSocial) {
    return res.status(400).json({
      message: "Falta fecha o razon social",
    });
  }

  const endAportacion = new Date(endPeriodoAportacion(fecha));

  try {
    const result = await rendimientos.aggregate([
      {
        $match: {
          tipo: razonSocial,
          createdAt: {
            $lte: endAportacion,
          },
        },
      },
      {
        $group: {
          _id: "$tipo",
          total: { $sum: { $toDecimal: "$rendimiento" } },
        },
      },
      {
        $unionWith: {
          coll: "Aportaciones",
          pipeline: [
            {
              $match: {
                tipo: razonSocial,
                createdAt: {
                  $lte: endAportacion,
                },
              },
            },
            {
              $group: {
                _id: "$tipo",
                total: { $sum: { $toDecimal: "$aportacion" } },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: "Patrimonio",
          pipeline: [
            {
              $match: {
                tipo: razonSocial,
                createdAt: {
                  $lte: endAportacion,
                },
              },
            },
            {
              $group: {
                _id: "$tipo",
                total: { $sum: { $toDecimal: "$patrimonio" } },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          total: { $sum: { $toDecimal: "$total" } },
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

router.get("/totalGeneralBySocios", async (req, res) => {
  // get fecha and razon social by req.query
  const { fecha, razonSocial } = req.query;

  // validate fecha and razon social
  if (!fecha || !razonSocial) {
    return res.status(400).json({
      message: "Falta fecha o razon social",
    });
  }

  const endAportacion = new Date(endPeriodoAportacion(fecha));

  try {
    const result = await rendimientos.aggregate([
      {
        $match: {
          tipo: razonSocial,
          createdAt: {
            $lte: endAportacion,
          },
        },
      },
      {
        $group: {
          _id: "$fichaSocio",
          total: { $sum: { $toDecimal: "$rendimiento" } },
        },
      },
      {
        $unionWith: {
          coll: "Aportaciones",
          pipeline: [
            {
              $match: {
                tipo: razonSocial,
                createdAt: {
                  $lte: endAportacion,
                },
              },
            },
            {
              $group: {
                _id: "$fichaSocio",
                total: { $sum: { $toDecimal: "$aportacion" } },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: "Patrimonio",
          pipeline: [
            {
              $match: {
                tipo: razonSocial,
                createdAt: {
                  $lte: endAportacion,
                },
              },
            },
            {
              $group: {
                _id: "$fichaSocio",
                total: { $sum: { $toDecimal: "$patrimonio" } },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          total: { $sum: { $toDecimal: "$total" } },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const data = result.map(({ _id: id, total }) => ({
      id,
      total,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({
      message: `Error al obtener total general para la fecha ${fecha} y razon social ${razonSocial}`,
    });
  }
});

// Obtener todos los rendimientos por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida",
    });
  }

  try {
    const result = await rendimientos.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => {
      return acc + Number(cur.rendimiento);
    }, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay rendimientos registrados",
        rendimientos: [],
        total,
      });
    } else {
      res.json({
        rendimientos: result,
        total,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener los rendimientos por socio",
    });
  }
});

router.get("/acumuladoByRazonSocial", async (req, res) => {
  const { tipo } = req.query;

  if (!tipo) {
    return res.status(400).json({
      message: "La razón social es requerida",
    });
  }

  try {
    const result = await rendimientos.aggregate([
      {
        $match: { tipo: { $eq: tipo } },
      },
      {
        $group: {
          _id: "$tipo",
          rendimiento: { $sum: { $toDecimal: "$rendimiento" } },
        },
      },
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay rendimientos acumulados",
        tipo,
        rendimiento: 0,
      });
    } else {
      const [item] = result;
      const { rendimiento, _id } = item;

      res.json({ _id, rendimiento: Number(rendimiento) });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el patrimonio acumuladas",
      error,
    });
  }
});

// Registro de rendimientos
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar rendimientos con el mismo numero de folio
  const busqueda = await rendimientos.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una rendimiento con este numero de folio" });
  } else {
    const rendimientosRegistrar = rendimientos(req.body);
    await rendimientosRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del rendimiento" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Registro de rendimientos
router.post("/registro2", async (req, res) => {
  const { fichaSocio } = req.body;

  // Inicia validacion para no registrar rendimientos con el mismo numero de folio
  const busqueda = await rendimientos.findOne({ fichaSocio });

  if (busqueda && busqueda.fichaSocio === fichaSocio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una rendimiento con este numero de folio" });
  } else {
    const rendimientosRegistrar = rendimientos(req.body);
    await rendimientosRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del rendimiento" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los rendimientos
router.get("/listar", async (_req, res) => {
    const { tipo, inicio, fin } = _req.query;
    await rendimientos
    .find( { tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') } } )
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de rendimientos
router.get("/numerorendimientos", async (_req, res) => {
  await rendimientos
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await rendimientos
    .find({ tipo })
    .count()
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los rendimientos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await rendimientos
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

  await rendimientos
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (_req, res) => {
  const registrorendimientos = await rendimientos.find().count();

  if (registrorendimientos === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimarendimiento] = await rendimientos
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    
    const nextFolio = ultimarendimiento.folio + 1;
    res.status(200).json({ folio: nextFolio });
  }
});

// Obtener un rendimiento en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  await rendimientos
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await rendimientos
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar una rendimiento
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await rendimientos
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Interes eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await rendimientos
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Intereses eliminados" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos de la rendimiento
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const { rendimiento: cash, createdAt } = req.body;

  // find patrimonio by id
  const result = await rendimientos.findById(id);

  if (!result) {
    res.status(404).json({ message: "Interes no encontrado" });
  }

  // update result
  await rendimientos
    .findByIdAndUpdate(id, {
      $set: {
        rendimiento: cash,
        createDate: createdAt,
      },
    })
    .then((_data) => res.status(200).json({message: "Interes actualizado" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
