const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const nodeMailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { Base64Encode } = require("base64-stream");
const { atob } = require("atob");

const rendimientos = require("../models/rendimientos");
const aportaciones = require("../models/aportaciones");
const patrimonio = require("../models/patrimonio");
const bajaSocios = require("../models/bajaSocios");
const prestamos = require("../models/prestamos");
const retiros = require("../models/retiros");
const empleados = require("../models/empleados");
const socios = require("../models/sindicalizados");
const abonos = require("../models/abonos");
const { getStatementAccount } = require("../utils/get-statement-account");
const { createStament } = require("../utils/stament-acounts");
const { verifyToken, isExpired } = require("../middleware/verifyToken");

router.get("/razon", verifyToken, async (req, res) => {
  const { tipo, periodo } = req.query;

  console.log(periodo)

  if (!tipo) {
    return res.status(400).json({
      message: "La razón social es requerida",
    });
  }

  try {
    const rAportaciones = await aportaciones.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
        },
      },
      {
        $group: {
          _id: "$tipo",
          aportaciones: { $sum: { $toDecimal: "$aportacion" } },
        },
      },
    ]);

    const rRendimientos = await rendimientos.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
         },
      },
      {
        $group: {
          _id: "$tipo",
          rendimientos: { $sum: { $toDecimal: "$rendimiento" } },
        },
      },
    ]);

    const rPatrimonio = await patrimonio.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
         },
      },
      {
        $group: {
          _id: "$tipo",
          patrimonio: { $sum: { $toDecimal: "$patrimonio" } },
        },
      },
    ]);

    const rPrestamos = await prestamos.aggregate([
      {
        $match: {
           tipo: { $eq: tipo },
           periodo: { $eq: parseInt(periodo)}, 
          },
      },
      {
        $group: {
          _id: "$tipo",
          prestamos: { $sum: { $toDecimal: "$prestamo" } },
        },
      },
    ]);

    const rRetiros = await retiros.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
        },
      },
      {
        $group: {
          _id: "$tipo",
          retiros: { $sum: { $toDecimal: "$retiro" } },
        },
      },
    ]);

    const rBajaSocios = await bajaSocios.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
        },
      },
      {
        $group: {
          _id: "$tipo",
          bajaSocios: { $sum: { $toDecimal: "$total" } },
        },
      },
    ]);

    const rAbonos = await abonos.aggregate([
      {
        $match: { 
          tipo: { $eq: tipo },
          periodo: { $eq: parseInt(periodo)}, 
         },
      },
      {
        $group: {
          _id: "$tipo",
          abonos: { $sum: { $toDecimal: "$abono" } },
        },
      },
    ]);

    const statement = {
      contributions: 0,
      yields: 0,
      patrimony: 0,
      loans: 0,
      withdrawals: 0,
      layoffs: 0,
      payment: 0
    };

    if (rAportaciones.length > 0) {
      const [item] = rAportaciones;
      const { aportaciones: totalAportaciones } = item;
      statement.contributions = Number(totalAportaciones);
    }

    if (rRendimientos.length > 0) {
      const [item] = rRendimientos;
      const { rendimientos: totalRendimientos } = item;
      statement.yields = Number(totalRendimientos);
    }

    if (rPatrimonio.length > 0) {
      const [item] = rPatrimonio;
      const { patrimonio: totalPatrimonio } = item;
      statement.patrimony = Number(totalPatrimonio);
    }

    if (rPrestamos.length > 0) {
      const [item] = rPrestamos;
      const { prestamos: totalPrestamos } = item;
      statement.loans = Number(totalPrestamos);
    }

    if (rRetiros.length > 0) {
      const [item] = rRetiros;
      const { retiros: totalRetiros } = item;
      statement.withdrawals = Number(totalRetiros);
    }

    if (rBajaSocios.length > 0) {
      const [item] = rBajaSocios;
      const { bajaSocios: totalBajaSocios } = item;
      statement.layoffs = Number(totalBajaSocios);
    }

    if (rAbonos.length > 0) {
      const [item] = rAbonos;
      const { abonos: totalAbonos } = item;
      statement.payment = Number(totalAbonos);
    }

    return res.status(200).json(statement);
  } catch (err) {
    return res.status(500).json({
      message: `Error al obtener el estado de cuenta por razón social ${tipo}`,
    });
  }
});

router.get("/socio", verifyToken, async (req, res) => {
  const { fichaSocio, periodo } = req.query;
  const paramFindSocio = [
    { ficha: { $eq: fichaSocio } },
    { estatus: { $eq: "true" } },
  ];

  if (!fichaSocio) {
    return res.status(400).json({
      message: "El número de ficha de socio es requerido",
    });
  }

  try {
    const empleado = await empleados.findOne({
      $and: paramFindSocio,
    });
    const socio = await socios.findOne({
      $and: paramFindSocio,
    });

    if (!empleado && !socio) {
      return res.status(400).json({
        message: "El socio no existe",
      });
    }

    const associate = empleado || socio;

    const statement = await getStatementAccount(associate, periodo);

    return res.status(200).json(statement);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: `Error al intentar generar el estado de cuenta para el socio con numero de ficha: ${fichaSocio}`,
    });
  }
});

router.get("/pdf/:fichaSocio", async (req, res) => {
  const { fichaSocio } = req.params;
  const { periodo, q } = req.query;

  if (!q) {
    return res.status(404).end();
  }

  const token = atob(q);

  if (isExpired(token)) {
    return res.status(404).end();
  }

  if (!jwt.verify(token, "secretkey")) {
    return res.status(404).end();
  }

  const paramFindSocio = [
    { ficha: { $eq: fichaSocio } },
    { estatus: { $eq: "true" } },
  ];

  try {
    if (!fichaSocio) {
      return res.status(400).json({
        message: "El número de ficha de socio es requerido",
      });
    }

    const empleado = await empleados.findOne({
      $and: paramFindSocio,
    });

    const socio = await socios.findOne({
      $and: paramFindSocio,
    });

    if (!empleado && !socio) {
      return res.status(400).json({
        message: "El socio no existe",
      });
    }

    const associate = empleado || socio;

    const statement = await getStatementAccount(associate, periodo);

    const filename = encodeURIComponent(
      `${fichaSocio}_${associate.nombre}_${associate.tipo}-${Date.now()}.pdf`
    );

    const doc = new PDFDocument({
      font: "Courier",
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");

    createStament(statement, doc);

    doc.flushPages();
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: `Error al intentar generar el estado de cuenta para el socio con numero de ficha: ${fichaSocio}`,
    });
  }
});

// create route send statement to email
router.get("/email/:fichaSocio", verifyToken, async (req, res) => {
  const { fichaSocio } = req.params;
  const { periodo } = req.query;

  console.log(periodo)

  const paramFindSocio = [
    { ficha: { $eq: fichaSocio } },
    { estatus: { $eq: "true" } },
  ];

  if (!fichaSocio) {
    return res.status(400).json({
      message: "El número de ficha de socio es requerido",
    });
  }

  try {
    const empleado = await empleados.findOne({
      $and: paramFindSocio,
    });
    const socio = await socios.findOne({
      $and: paramFindSocio,
    });

    if (!empleado && !socio) {
      return res.status(400).json({
        message: "El socio no existe",
      });
    }

    const associate = empleado || socio;

    if (!empleado && !socio) {
      return res.status(400).json({
        message: "El socio no existe",
      });
    }

    const statement = await getStatementAccount(associate, periodo);

    const doc = new PDFDocument({
      font: "Courier",
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    createStament(statement, doc);

    doc.flushPages();

    const stream = doc.pipe(new Base64Encode());

    doc.end();

    let pdfBase64 = "";
    let pdf;

    const resultPdf = await new Promise((resolve) => {
      stream
        .on("data", (chunk) => {
          pdfBase64 += chunk;
        })
        .on("end", () => {
          pdf = Buffer.from(pdfBase64, "base64");
          resolve(pdf);
        })
        .on("error", (err) => {
          console.error(err);
        });
    });

    const transporter = nodeMailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "ca.condutel@condumex.com.mx",
        pass: "cah05.2025",
      },
    });

    const mailOptions = {
      from: "CAJA DE AHORRO CONDUMEX <ca.condutel@condumex.com.mx>",
      to: associate.correo,
      subject: "Estado de cuenta",
      text: "Estado de cuenta",
      html: `<h1>Estado de cuenta</h1>
      <p>
        <b>Nombre:</b> ${associate.nombre}
      </p>
      <p>
        <b>Tipo:</b> ${associate.tipo}
      </p>
      <p>
        <b>Ficha:</b> ${associate.ficha}
      </p>
      <p>`,
      attachments: [
        {
          filename: `${fichaSocio}_${associate.nombre}_${associate.tipo
            }-${Date.now()}.pdf`,
          content: resultPdf,
          contentType: "application/pdf",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodeMailer.getTestMessageUrl(info));
    });

    return res.status(200).json({
      message: "El estado de cuenta fue enviado a su correo",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: `Error al intentar generar el estado de cuenta para el socio con numero de ficha: ${fichaSocio}`,
    });
  }
});

module.exports = router;
