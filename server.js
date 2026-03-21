const express = require("express");
const app = express();

app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// Ruta de prueba
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "Todo bien" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo"));
