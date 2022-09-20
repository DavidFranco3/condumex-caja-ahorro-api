const express = require("express");
const router = express.Router();
const deudaSocio = require("../models/deudaSocio");

// Obtener todos las deudas por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida",
    });
  }

  try {
    const result = await deudaSocio.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => acc + cur.deudaSocio, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay deudas registrados",
        deudaSocio: [],
        total,
      });
    } else {
      res.json({
        deudaSocio: result,
        total,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las deudas por socio",
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
    const result = await deudaSocio.aggregate([
      {
        $match: { tipo: { $eq: tipo } },
      },
      {
        $group: {
          _id: "$tipo",
          deudaSocio: { $sum: { $toDecimal: "$deudaSocio" } },
        },
      },
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay deudas acumuladas",
        tipo,
        deudaSocio: 0,
      });
    } else {
      const [item] = result;
      const { deudaSocio, _id } = item;

      res.json({ _id, deudaSocio: Number(deudaSocio) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las deudas acumulados por razón social",
    });
  }
});

// Registro de deudas 
router.post("/registro", async (req, res) => {
  const { fichaSocio } = req.body;

  // Inicia validacion para no registrar deudas con el mismo folio
  const busqueda = await deudaSocio.findOne({ fichaSocio });

  if (busqueda && busqueda.fichaSocio === fichaSocio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe una deuda con esta ficha" });
  } else {
    const deudasRegistrar = deudaSocio(req.body);
    await deudasRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso de la deuda" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos las deudas
router.get("/listar", async (req, res) => {
  const { tipo, inicio, fin } = req.query;
    await deudaSocio
    .find({ tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') } })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de deudas
router.get("/numeroDeudas", async (req, res) => {
  await deudaSocio
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await deudaSocio
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando las deudas
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;

  const skip = (pagina - 1) * limite;

  await deudaSocio
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

  const skip = (pagina - 1) * limite;

  await deudaSocio
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (req, res) => {
  const registrodeudas = await deudaSocio.find().count();
  if (registrodeudas === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimaDeuda] = await deudaSocio
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimaDeuda.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un deuda en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  await deudaSocio
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await deudaSocio
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un deuda
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await deudaSocio
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "deuda eliminada" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
   const { id } = req.params;
  const { abonoTotal, prestamoTotal, movimiento, createdAt } = req.body;

  // find patrimonio by id
  const result = await deudaSocio.findById(id);

  if (!result) {
    res.status(404).json({ message: "Deuda no encontrada" });
  }

  // update result
  await deudaSocio
    .findByIdAndUpdate(id, {
      $set: {
        abonoTotal: abonoTotal,
        prestamoTotal: prestamoTotal,
        movimiento: movimiento,
        createDate: createdAt,
      },
    })
    .then((_data) => res.status(200).json({message: "Deuda actualizada" }))
    .catch((error) => res.json({ message: error }));
});

// Borrar muchas deudas
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await deudaSocio
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Deudas eliminadas" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
