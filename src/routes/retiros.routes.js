const express = require("express");
const router = express.Router();
const retiros = require("../models/retiros");

// Obtener todos los retiros por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida"
    });
  }

  try {
    const result = await retiros.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => {
      return acc + Number(cur.retiro);
    }, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay retiros registrados",
        retiros: [],
        total
      });
    } else {
      res.json({
        retiros: result,
        total
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener los retiros por socio"
    });
  }
});

router.get("/acumuladoByRazonSocial", async (req, res) => {
  const { tipo } = req.query;

  if (!tipo) {
    return res.status(400).json({
      message: "La razón social es requerida"
    });
  }

  try {
    const result = await retiros.aggregate([
      {
        $match: { tipo: { $eq: tipo } }
      },
      {
        $group: {
          _id: "$tipo",
          retiro: { $sum: { $toDecimal: "$retiro" } }
        }
      }
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay retiros acumuladas",
        tipo,
        retiros: 0
      });
    } else {
      const [item] = result;
      const { retiro, _id } = item;

      res.json({ _id, retiros: Number(retiro) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las retiros acumuladas por razón social"
    });
  }
});

// Registro de retiros
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar retiros con el mismo folio
  const busqueda = await retiros.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un prestamo con este folio" });
  } else {
    const retirosRegistrar = retiros(req.body);
    await retirosRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del prestamo" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Registro de retiros
router.post("/registro2", async (req, res) => {
  const { fichaSocio } = req.body;

  // Inicia validacion para no registrar retiros con el mismo folio
  const busqueda = await retiros.findOne({ fichaSocio });

  if (busqueda && busqueda.fichaSocio === fichaSocio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un prestamo con este folio" });
  } else {
    const retirosRegistrar = retiros(req.body);
    await retirosRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del prestamo" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los retiros
router.get("/listar", async (_req, res) => {
  const { tipo, inicio, fin } = _req.query;
    await retiros
    .find( {tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') } })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de retiros
router.get("/numeroRetiros", async (_req, res) => {
  await retiros
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await retiros
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los retiros
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await retiros
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

  await retiros
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (_req, res) => {
  const registroretiros = await retiros.find().count();
  if (registroretiros === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoRetiro] = await retiros.find({}).sort({ folio: -1 }).limit(1);
    const tempFolio = ultimoRetiro.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un socio en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;

  await retiros
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await retiros
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un retiro
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await retiros
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Retiro eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del retiro
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const { retiro } = req.body;
  await retiros
    .updateOne({ _id: id }, { $set: { retiro } })
    .then((_data) =>
      res.status(200).json({ mensaje: "Datos del retiro actualizados" })
    )
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await retiros
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Retiros eliminados" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
