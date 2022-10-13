const rendimientos = require("../models/rendimientos");
const aportaciones = require("../models/aportaciones");
const patrimonio = require("../models/patrimonio");
const bajaSocios = require("../models/bajaSocios");
const prestamos = require("../models/prestamos");
const retiros = require("../models/retiros");
const abonos = require("../models/abonos");

async function getStatementAccount(associate) {
  try {
    const paramFind = { fichaSocio: { $eq: associate.ficha } };
    const paramSort = { createdAt: -1 };

    const rAportaciones = await aportaciones.find(paramFind).sort(paramSort);
    const rPatrimonio = await patrimonio.find(paramFind).sort(paramSort);
    const rRendimiento = await rendimientos.find(paramFind).sort(paramSort);
    const rPrestamos = await prestamos.find(paramFind).sort(paramSort);
    const rRetiros = await retiros.find(paramFind).sort(paramSort);
    const rBajas = await bajaSocios.find(paramFind).sort(paramSort);
    const rAbonos = await abonos.find(paramFind).sort(paramSort);

    let abonosTotal = 0;
    for (const { abono: val } of rAbonos) {
      abonosTotal += Number(val);
    }
        
    let aportacionesTotal = 0;
    for (const { aportacion: val } of rAportaciones) {
      aportacionesTotal += Number(val);
    }

    let patrimonioTotal = 0;
    for (const { patrimonio: val } of rPatrimonio) {
      patrimonioTotal += Number(val);
    }

    let rendimientosTotal = 0;
    for (const { rendimiento: val } of rRendimiento) {
      rendimientosTotal += Number(val);
    }

    let prestamosTotal = 0;
    for (const { prestamoTotal: val } of rPrestamos) {
      prestamosTotal += Number(val);
    }

    let retirosTotal = 0;
    for (const { retiro: val } of rRetiros) {
      retirosTotal += Number(val);
    }

    let bajasTotal = 0;
    for (const { baja: val } of rBajas) {
      bajasTotal += Number(val);
    }

    return {
      company: {
        name: associate.tipo,
      },
      associate: {
        token: associate.ficha,
        name: associate.nombre,
        email: associate.correo,
      },
      contributions: {
        data: rAportaciones,
        total: aportacionesTotal,
      },
      patrimony: {
        data: rPatrimonio,
        total: patrimonioTotal,
      },
      yields: {
        data: rRendimiento,
        total: rendimientosTotal,
      },
      loans: {
        data: rPrestamos,
        total: prestamosTotal,
      },
      withdrawals: {
        data: rRetiros,
        total: retirosTotal,
      },
      layoffs: {
        data: rBajas,
        total: bajasTotal,
      },
      payment: {
        data: rAbonos,
        total: abonosTotal,
      },
      balances: {
        balancePositive: parseFloat(aportacionesTotal + patrimonioTotal + rendimientosTotal),
        negativeBalance: parseFloat(prestamosTotal - abonosTotal),
      },
    };
  } catch (error) {
    console.error(error);
    return {};
  }
}

module.exports = { getStatementAccount };
