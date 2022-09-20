const moment = require("moment");

// Función que determina la ejecución de los respaldos
function lanzarElDia(momento, tarea) {
  console.log("lanzado", new Date());
  console.log("para ser ejecutado en", momento);

  setTimeout(tarea, momento.getTime() - new Date().getTime());
}

console.log(moment(new Date()).endOf("month").format("YYYY-DD-MM"));

// Tarea de respaldos
function tarea() {
  console.log("acá va la tarea, ejecucion completada", new Date());
}

lanzarElDia(new Date("2022-05-13 12:59"), tarea);
