const express = require("express");
const router = express.Router();
const abonos = require("../models/abonos");

// Obtener todos los abonos por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida",
    });
  }

  try {
    const result = await abonos.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => acc + cur.abono, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay abonos registrados",
        abonos: [],
        total,
      });
    } else {
      res.json({
        abonos: result,
        total,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener los abonos por socio",
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
    const result = await abonos.aggregate([
      {
        $match: { tipo: { $eq: tipo } },
      },
      {
        $group: {
          _id: "$tipo",
          abono: { $sum: { $toDecimal: "$abonos" } },
        },
      },
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay abonos acumulados",
        tipo,
        abonos: 0,
      });
    } else {
      const [item] = result;
      const { abono, _id } = item;

      res.json({ _id, abono: Number(abono) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las abonos acumulados por razón social",
    });
  }
});

// Registro de abonos
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar abonos con el mismo folio
  const busqueda = await abonos.findOne({ folio });

  if (busqueda && busqueda.fichaSocio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un abono con este folio" });
  } else {
    const abonosRegistrar = abonos(req.body);
    await abonosRegistrar
      .save()
      .then((data) =>
        res.status(200).json({ mensaje: "Registro exitoso del abono" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los abonos
router.get("/listar", async (req, res) => {
  const { tipo, inicio, fin } = req.query;
    await abonos
    .find({ tipo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener todos los abonos
router.get("/listar2", async (req, res) => {
  const { tipo } = req.query;
    await abonos
    .find({ tipo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de abonos
router.get("/numeroAbonos", async (req, res) => {
  await abonos
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await abonos
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los abonos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await abonos
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

  await abonos
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (req, res) => {
  const registroabonos = await abonos.find().count();
  if (registroabonos === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoAbono] = await abonos
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimoAbono.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un abono en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await abonos
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await abonos
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un abono
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await abonos
    .deleteOne({ _id: id })
    .then((data) => res.status(200).json({ mensaje: "abono eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  const {  abono, movimiento, createdAt  } =
    req.body;
  await abonos
    .updateOne(
      { _id: id },
      { $set: {  abono, movimiento, createdAt } }
    )
    .then((data) =>
      res.status(200).json({ mensaje: "Abono actualizados" })
    )
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await abonos
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Abonos eliminados" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
