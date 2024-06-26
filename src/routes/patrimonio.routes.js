const express = require("express");
const router = express.Router();
const patrimonios = require("../models/patrimonio");

// Obtener todos los patrimonios por socio
router.get("/bySocio", async (req, res) => {
  const { ficha, periodo } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida"
    });
  }

  try {
    const result = await patrimonios.find({ fichaSocio: { $eq: ficha }, periodo });
    const total = result.reduce((acc, cur) => {
      return acc + Number(cur.patrimonio);
    }, 0)
    if (result.length === 0) {
      res.json({
        message: "No hay patrimonios registrados",
        patrimonio: [],
        total
      });
    } else {
      res.json({
        patrimonio: result,
        total
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener los patrimonios por socio"
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
    const result = await patrimonios.aggregate([
      {
        $match: { tipo: { $eq: tipo } }
      },
      {
        $group: {
          _id: "$tipo",
          patrimonio: { $sum: { $toDecimal: "$patrimonio" } }
        }
      }
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay patrimonios acumulados",
        tipo,
        patrimonio: 0
      });
    } else {
      const [item] = result;
      const { patrimonio, _id } = item;

      res.json({ _id, patrimonio: Number(patrimonio) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las patrimonios acumulados por razón social"
    });
  }
});

// Obtener todos los abonos
router.get("/listar", async (req, res) => {
  const { tipo, inicio, fin } = req.query;
  await patrimonios
    .find({ tipo, createdAt: { $gte: new Date(inicio + 'T00:00:00.000Z'), $lte: new Date(fin + 'T23:59:59.999Z') } })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

router.get("/listarPatrimonios", async (req, res) => {
  const { tipo } = req.query;
  await patrimonios
    .find({ tipo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

router.get("/listarPeriodo", async (req, res) => {
  const { tipo, periodo } = req.query;
  await patrimonios
    .find({ tipo, periodo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Registro de patrimonios
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar patrimonios con el mismo folio
  const busqueda = await patrimonios.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un patrimonio con este folio" });
  } else {
    const patrimonioRegistrar = patrimonios(req.body);
    await patrimonioRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del patrimonio" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener el numero total de registros de patrimonios
router.get("/numeroPatrimonios", async (req, res) => {
  await patrimonios
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await patrimonios
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxSocioTipo", async (req, res) => {
  const { tipo, ficha } = req.query;
  await patrimonios
    .find({ tipo, ficha })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los patrimonios
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await patrimonios
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

  await patrimonios
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (req, res) => {
  const registropatrimonio = await patrimonios.find().count();
  if (registropatrimonio === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoPatrimonio] = await patrimonios
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimoPatrimonio.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un patrimonio en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await patrimonios
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await patrimonios
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un patrimonio
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await patrimonios
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Patrimonio eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id)
  const { patrimonio, movimiento, createdAt } =
    req.body;
  await patrimonios
    .updateOne(
      { _id: id },
      { $set: { patrimonio, movimiento, createdAt } }
    )
    .then((data) =>
      res.status(200).json({ mensaje: "Patrimonio actualizado" })
    )
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo", async (req, res) => {
  const { fecha, tipo } = req.query;
  await patrimonios
    .deleteMany({
      tipo: tipo,
      $and: [
        { createdAt: { $gte: (fecha + "T00:00:00.000Z") } },
        { createdAt: { $lte: (fecha + "T23:59:59.999Z") } }
      ]
    })
    .then((_data) => res.status(200).json({ mensaje: "Patrimonios eliminados" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
