const express = require("express");
const router = express.Router();
const prestamos = require("../models/prestamos");

// Obtener todos los prestamos por socio
router.get("/bySocio", async (req, res) => {
  const { ficha } = req.query;

  if (!ficha) {
    return res.status(400).json({
      message: "La ficha del socio es requerida"
    });
  }

  try {
    const result = await prestamos.find({ fichaSocio: { $eq: ficha } });
    const total = result.reduce((acc, cur) => acc + cur.prestamo, 0);

    if (result.length === 0) {
      res.json({
        message: "No hay prestamos registrados",
        prestamos: [],
        total
      });
    } else {
      res.json({
        prestamos: result,
        total
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener los prestamos por socio"
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
    const result = await prestamos.aggregate([
      {
        $match: { tipo: { $eq: tipo } }
      },
      {
        $group: {
          _id: "$tipo",
          prestamo: { $sum: { $toDecimal: "$prestamo" } }
        }
      }
    ]);

    if (result.length === 0) {
      res.json({
        message: "No hay prestamos acumulados",
        tipo,
        prestamo: 0
      });
    } else {
      const [item] = result;
      const { prestamo, _id } = item;

      res.json({ _id, prestamo: Number(prestamo) });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error al obtener las prestamos acumulados por razón social"
    });
  }
});

// Registro de prestamos
router.post("/registro", async (req, res) => {
  const { folio } = req.body;

  // Inicia validacion para no registrar prestamos con el mismo folio
  const busqueda = await prestamos.findOne({ folio });

  if (busqueda && busqueda.folio === folio) {
    return res
      .status(401)
      .json({ mensaje: "Ya existe un prestamo con este ficha" });
  } else {
    const prestamosRegistrar = prestamos(req.body);
    await prestamosRegistrar
      .save()
      .then((_data) =>
        res.status(200).json({ mensaje: "Registro exitoso del prestamo" })
      )
      .catch((error) => res.json({ message: error }));
  }
});

// Obtener todos los abonos
router.get("/listar", async (req, res) => {
  const { tipo, inicio, fin } = req.query;
    await prestamos
    .find({ tipo, createdAt: { $gte: new Date(inicio+'T00:00:00.000Z'), $lte: new Date(fin+'T23:59:59.999Z') } })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener todos los abonos
router.get("/listar2", async (req, res) => {
  const { tipo } = req.query;
    await prestamos
    .find({ tipo })
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero total de registros de prestamos
router.get("/numeroPrestamos", async (req, res) => {
  await prestamos
    .find()
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxTipo", async (req, res) => {
  const { tipo } = req.query;
  await prestamos
    .find({ tipo })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el total de registros de cada razon social
router.get("/totalxSocioTipo", async (req, res) => {
  const { tipo, ficha } = req.query;
  await prestamos
    .find({ tipo, ficha })
    .count()
    .sort({ _id: -1 })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Listar paginando los prestamos
router.get("/listarPaginando", async (req, res) => {
  const { pagina, limite } = req.query;
  // console.log("Pagina ", pagina , " Limite ", limite)

  const skip = (pagina - 1) * limite;

  await prestamos
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

  await prestamos
    .find({ tipo })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limite)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener el numero de folio actual
router.get("/obtenerFolio", async (req, res) => {
  const registroprestamos = await prestamos.find().count();
  if (registroprestamos === 0) {
    res.status(200).json({ folio: 1 });
  } else {
    const [ultimoPrestamo] = await prestamos
      .find({})
      .sort({ folio: -1 })
      .limit(1);
    const tempFolio = ultimoPrestamo.folio + 1;
    res.status(200).json({ folio: tempFolio });
  }
});

// Obtener un prestamo en especifico
router.get("/obtener/:id", async (req, res) => {
  const { id } = req.params;
  // console.log("buscando")
  await prestamos
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFicha/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;

  await prestamos
    .findOne({ fichaSocio })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Obtener un socio segun el numero de ficha
router.get("/obtenerxFecha", async (req, res) => {
  const { fecha } = req.params;

  await prestamos
     .find({ createdAt: { $gte: new Date(fecha+'T00:00:00.000Z'), $lte: new Date(fecha+'T23:59:59.999Z') } })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// Borrar un prestamo
router.delete("/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  await prestamos
    .deleteOne({ _id: id })
    .then((_data) => res.status(200).json({ mensaje: "Prestamo eliminado" }))
    .catch((error) => res.json({ message: error }));
});

// Actualizar datos del usuario
router.put("/actualizar/:id", async (req, res) => {
 const { id } = req.params;
  const { prestamo, prestamoTotal, tasaInteres, createdAt } = req.body;

  // find patrimonio by id
  const result = await prestamos.findById(id);

  if (!result) {
    res.status(404).json({ message: "Prestamo no encontrado" });
  }

  // update result
  await prestamos
    .findByIdAndUpdate(id, {
      $set: {
        prestamo: prestamo,
        prestamoTotal: prestamoTotal,
        tasaInteres: tasaInteres,
        createDate: createdAt,
      },
    })
    .then((_data) => res.status(200).json({message: "Prestamo actualizado" }))
    .catch((error) => res.json({ message: error }));
});

// Borrar muchos rendimientos
router.delete("/eliminarMasivo/:fecha", async (req, res) => {
  const { fecha } = req.params;
  await prestamos
    .remove( {
        $and: [
        {createdAt: {$gte: (fecha+"T00:00:00.000Z")}},
        {createdAt: {$lte: (fecha+"T23:59:59.999Z")}}
        ]
        } )
    .then((_data) => res.status(200).json({ mensaje: "Prestamos eliminados" }))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;
