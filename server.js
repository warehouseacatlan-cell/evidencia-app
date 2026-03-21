const express = require("express");
const app = express();

app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// Ejemplo de endpoint
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "Todo bien" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo"));
