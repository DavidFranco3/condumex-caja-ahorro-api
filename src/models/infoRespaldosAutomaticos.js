const mongoose = require("mongoose");
const { Schema } = mongoose;

const infoRespaldos = new Schema(
  {
    folio: { type: Number, required: true },
    correos: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InfoRespaldosAutomaticos", infoRespaldos, "InfoRespaldosAutomaticos");
