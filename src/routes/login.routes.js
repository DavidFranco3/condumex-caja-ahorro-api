const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const usuario = require("../models/usuarios");

router.post("/login", async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) res.status(400).json({ mensaje: "Faltan datos" });

  const usuarios = await usuario.findOne({ correo });
  // console.log(usuarios)
  if (!usuarios)
    return res.status(401).json({ mensaje: "Usuario no registrado" });
  if (usuarios.estado === "true") {
    if (usuarios.correo !== correo)
      return res.status(401).json({ mensaje: "Correo Incorrecto" });
    if (usuarios.password !== password)
      return res.status(401).json({ mensaje: "Contraseña Incorrecta" });

    const token = await jwt.sign({ _: usuarios._id }, "secretkey", {
      expiresIn: 86400,
    });

    res.status(200).json({ token });
  } else {
    return res.status(401).json({ mensaje: "Inicio de sesion no autorizado" });
  }
});

module.exports = router;
