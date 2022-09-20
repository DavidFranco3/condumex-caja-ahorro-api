const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Definimos las credenciales del servicio
const transporter = nodemailer.createTransport({
  host: "server.cucc.com.mx",
  port: 465,
  auth: {
    user: "admin@catalogodigital.mx",
    pass: "jqntE(h!dr^u",
  },
  secure: true,
});

// Envio de correos al usuario del sistema
router.post("/enviar", async (req, res) => {
  const { destinatario, asunto, mensaje } = req.body;

  await new Promise((resolve, reject) => {
    // Verifica la configuracion
    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("El servidor esta listo para enviar el correo");
        resolve(success);
      }
    });
  });

  const sendHtml = mensaje;

  const mailOptions = {
    from: "no-reply@condumex.com.mx",
    to: destinatario,
    subject: asunto,
    attachDataUrls: true,
    html: sendHtml,
  };

  await new Promise((resolve, reject) => {
    // Enviar el correo
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(401).json({ mensaje: "Correo no enviado" });
      } else {
        console.log(info);
        resolve(info);
      }
    });
  });

  return res.status(200).json({ mensaje: "Correo enviado" });
});

// Envio de correos indicando remitente y destinatario
router.post("/enviarCorreo", async (req, res) => {
  const { remitente, destinatario, asunto, mensaje } = req.body;

  await new Promise((resolve, reject) => {
    // Verifica la configuracion
    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("El servidor esta listo para enviar el correo");
        resolve(success);
      }
    });
  });

  const sendHtml = mensaje;

  const mailOptions = {
    from: remitente,
    to: destinatario,
    subject: asunto,
    attachDataUrls: true,
    html: sendHtml,
  };

  await new Promise((resolve, reject) => {
    // Enviar el correo
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(401).json({ mensaje: "Correo no enviado" });
      } else {
        console.log(info);
        resolve(info);
      }
    });
  });

  return res.status(200).json({ mensaje: "Correo enviado" });
});

module.exports = router;
