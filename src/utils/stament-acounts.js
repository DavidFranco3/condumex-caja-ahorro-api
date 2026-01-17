const moment =  require("moment");
require('moment/locale/es');

// Configura el idioma a español
moment.locale("es");

const FRACTION_DIGITS = 2;
const LOCALE = "es-MX";

// create const to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  }).format(value);
};

const generateHeader = (doc, { name }) => {
  doc
    .image("./src/assets/logo.png", 30, 50, { width: 90 })
    .fillColor("#000000")
    .font("Courier-Bold")
    .fontSize(16)
    .text(name, 50, 70, {
      align: "center",
    })
    .moveDown();
};

const generateSocioInformation = (doc, { token, name, email }) => {
  doc
    .fillColor("#000000")
    .font("Courier-Bold")
    .fontSize(12)
    .text("Estado de Cuentas".toLocaleUpperCase(), 50, 150);

  generateHr(doc, 165);

  const customerInformationTop = 175;

  doc
    .fontSize(10)
    .font("Courier-Bold")
    .text("Ficha:", 50, customerInformationTop)
    .font("Courier")
    .text(token, 170, customerInformationTop)
    .font("Courier-Bold")
    .text("Nombre del socio:", 50, customerInformationTop + 15)
    .font("Courier")
    .text(name, 170, customerInformationTop + 15)
    .font("Courier-Bold")
    .text("Correo eléctronico:", 50, customerInformationTop + 30)
    .font("Courier")
    .text(email, 170, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 222);
};

const generateBalances = (doc, balancePositive, negativeBalance, y ) => {
  let positionY = y;

  if (positionY + 60 > 730) {
    doc.addPage();
    y = 50;
    positionY = y;
  }
    
    doc
    .fillColor("#000000")
    .font("Courier-Bold")
    .fontSize(12)
    .text("*****Saldos*****".toLocaleUpperCase(), 50, positionY, {
      align: "center",
    });

  generateHr(doc, positionY - 40);

  const customerInformationTop = positionY + 30;

  doc
    .fontSize(10)
    .font("Courier-Bold")
    .text("SALDO A FAVOR", 50, customerInformationTop)
    .font("Courier-Bold")
    .text(formatCurrency(balancePositive), 170, customerInformationTop, {
      align: "right",
    })
    .font("Courier-Bold")
    .text("SALDO DEUDOR", 50, customerInformationTop + 15)
    .font("Courier-Bold")
    .text(formatCurrency(negativeBalance), 170, customerInformationTop + 15, {
      align: "right",
    })
    .moveDown();

  generateHr(doc, positionY + 20);
};

const generateRow = (doc, positionY, index, fechaCreacion, monto) => {
  doc
    .fontSize(10)
    .text(index, 50, positionY)
    .text(fechaCreacion, 150, positionY)
    .text(monto, 250, positionY, {
      align: "right",
    });
};

const generateTable = (doc, title, data, y) => {
  let positionY = y;
  let count = 1;

  if (positionY + 60 > 730) {
    doc.addPage();
    y = 50;
    positionY = y;
  }

  doc
    .font("Courier-Bold")
    .fontSize(12)
    .text(`*****${title}*****`.toLocaleUpperCase(), 50, positionY, {
      align: "center",
    });

  positionY += 15;
  generateHr(doc, positionY);
  positionY += 15;
  generateRow(doc, positionY, "#", "FECHA", "MONTO");
  positionY += 20;
  generateHr(doc, positionY);

  doc.font("Courier");

  data.forEach(({ descripcion, fechaCreacion, monto }, index) => {
    positionY = y + 30 + count * 30;

    if (positionY > 730) {
      doc.addPage();
      count = 1;
      y = 50;
      positionY = y + 30 + count * 30;
    }

    descripcion && doc.font("Courier-Bold");
    !descripcion && doc.font("Courier");

    generateRow(
      doc,
      positionY,
      descripcion || index + 1,
      descripcion ? "" : moment(fechaCreacion).format('LL'),
      formatCurrency(monto)
    );

    !descripcion && generateHr(doc, positionY + 20);

    count++;
  });

  return positionY;
};

const generateMetadata = (doc, { name }) => {
  doc.info.Title = "Estado de Cuentas";
  doc.info.Author = name;
  doc.info.Subject = "Estado de Cuentas";
  doc.info.Keywords = "Estado, cuentas, socio,condumex";
  doc.info.CreationDate = new Date();
  doc.info.ModDate = new Date();
};

const generateHr = (doc, y) => {
  doc.strokeColor("#a9a9a9").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

const generateFooter = (doc) => {
  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index++) {
    doc.switchToPage(index);
    doc.fontSize(10).font("Courier");

    const oldMarginBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fillColor("#444444")
      .text(
        `${index + 1} de ${pages.count}`,
        0,
        doc.page.height - oldMarginBottom / 2,
        {
          align: "right",
        }
      );

    doc.page.margins.bottom = oldMarginBottom;
  }
};

const createStament = (stament, doc) => {
  const { contributions, patrimony, yields, withdrawals, loans, payment, company, associate } =
    stament;

  contributions.data = contributions.data.map(
    ({ createdAt: fechaCreacion, aportacion: monto }) => ({
      fechaCreacion,
      monto,
    })
  );

  patrimony.data = patrimony.data.map(
    ({ createdAt: fechaCreacion, patrimonio: monto }) => ({
      fechaCreacion,
      monto,
    })
  );

  yields.data = yields.data.map(
    ({ createdAt: fechaCreacion, rendimiento: monto }) => ({
      fechaCreacion,
      monto,
    })
  );

  withdrawals.data = withdrawals.data.map(
    ({ createdAt: fechaCreacion, retiro: monto }) => ({ 
        fechaCreacion, 
        monto,
    })
  );
  
  loans.data = loans.data.map(
    ({ createdAt: fechaCreacion, prestamoTotal: monto }) => ({ 
       fechaCreacion,
       monto,
    })     
  );
  
  payment.data = payment.data.map(
    ({ createdAt: fechaCreacion, abono: monto }) => ({ 
       fechaCreacion,
       monto,
    })     
  );

  contributions.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: contributions.total,
  });

  patrimony.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: patrimony.total,
  });

  yields.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: yields.total,
  });

  withdrawals.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: withdrawals.total,
  });
  
  loans.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: loans.total,
  });
  
  payment.data.push({
    descripcion: "TOTAL",
    fechaCreacion: "",
    monto: payment.total,
  });

  generateMetadata(doc, company);
  generateHeader(doc, company);
  generateSocioInformation(doc, associate);
  
  const { name } =  company;
  
  console.log(name);
  if (name === "Asociación de Empleados Sector Cables A.C."){
  const y1 = generateTable(doc, "Aportaciones", contributions.data, 260);
  const y2 = generateTable(doc, "Patrimonio", patrimony.data, y1 + 30);
  const y3 = generateTable(doc, "Intereses", yields.data, y2 + 30);
  const y4 = generateTable(doc, "Retiros", withdrawals.data, y3 + 30);
  const y5 = generateTable(doc, "Préstamos", loans.data, y4 + 30);
  const y6 = generateTable(doc, "Abonos", payment.data, y5 + 30);
  
  generateBalances(doc, contributions.total + patrimony.total + yields.total, loans.total - payment.total, y6 + 30);
  } else {
  const y1 = generateTable(doc, "Aportaciones", contributions.data, 260);
  const y2 = generateTable(doc, "Intereses", yields.data, y1 + 30);
  const y3 = generateTable(doc, "Retiros", withdrawals.data, y2 + 30);
  const y4 = generateTable(doc, "Préstamos", loans.data, y3 + 30);
  const y5 = generateTable(doc, "Abonos", payment.data, y4 + 30);
  
  generateBalances(doc, contributions.total + yields.total, loans.total - payment.total, y5 + 30);
  }
  generateFooter(doc);
};

module.exports = {
  createStament,
};
