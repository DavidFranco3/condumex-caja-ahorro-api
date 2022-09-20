/* eslint no-undef: "off" */
db.createUser({
  user: "root",
  pwd: "root",
  roles: [
    {
      role: "readWrite",
      db: "caja-de-ahorros-local",
    },
  ],
});
