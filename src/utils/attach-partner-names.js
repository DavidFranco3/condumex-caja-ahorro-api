const sindicalizados = require("../models/sindicalizados");
const empleados = require("../models/empleados");
const sociosEspeciales = require("../models/sociosEspeciales");

async function attachPartnerNames(records) {
  if (!records) return records;

  const isArray = Array.isArray(records);
  const data = isArray ? records : [records];
  
  if (data.length === 0) return records;

  // Convert to plain objects and apply transforms (like Decimal128 -> Number)
  const plainRecords = data.map(record => {
    if (record.toJSON && typeof record.toJSON === 'function') {
      return record.toJSON();
    }
    return { ...record };
  });

  // Group by type to minimize database calls
  const recordsByType = plainRecords.reduce((acc, record) => {
    const type = record.tipo ? record.tipo.trim() : "Unknown";
    if (!acc[type]) acc[type] = [];
    acc[type].push(record);
    return acc;
  }, {});

  for (const type in recordsByType) {
    let model;
    const normalizedType = type.toUpperCase();
    
    if (normalizedType.includes("SINDICALIZADO") || normalizedType.includes("SINDICATO")) {
      model = sindicalizados;
    } else if (normalizedType.includes("CONFIANZA") || normalizedType.includes("EMPLEADO") || normalizedType.includes("ASOCIACIÓN")) {
      model = empleados;
    } else if (normalizedType.includes("ESPECIAL")) {
      model = sociosEspeciales;
    }

    if (model) {
      const fichas = [...new Set(recordsByType[type].map(r => r.fichaSocio))].filter(f => f !== undefined);
      if (fichas.length > 0) {
        const partners = await model.find({ ficha: { $in: fichas } }, "ficha nombre");
        
        const partnerMap = partners.reduce((acc, p) => {
          acc[p.ficha.toString()] = p.nombre;
          return acc;
        }, {});

        recordsByType[type].forEach(record => {
          const fichaStr = record.fichaSocio ? record.fichaSocio.toString() : "";
          record.nombreSocio = partnerMap[fichaStr] || "Socio no encontrado";
        });
      }
    } else {
      recordsByType[type].forEach(record => {
        record.nombreSocio = "Tipo de socio desconocido";
      });
    }
  }

  return isArray ? plainRecords : plainRecords[0];
}

module.exports = { attachPartnerNames };
