const mongoose = require("mongoose");

// Credenciales para conexion local a la BD
const URI = "mongodb://David:123456@localhost:27017/caja-de-ahorro";

// Credenciales para conexion a Mongo Atlas
//const URI ="mongodb+srv://caja-de-ahorro:pVgzXxPMG2RU15Is@cluster0.dsbmu.mongodb.net/caja-de-ahorro";

mongoose.Promise = global.Promise;

mongoose
  .connect(URI, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.log("Database connection error: ", err);
  });

process.on("uncaughtException", (err, origin) => {
  console.error("Caught exception: " + err);
  console.error("Exception origin: " + origin);
});

module.exports = mongoose;
