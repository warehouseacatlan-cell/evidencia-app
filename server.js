const express = require("express");
const multer = require("multer");
const app = express();

app.use(express.json());

// Guardado en memoria (temporal)
let pedidos = [];

// =====================
// CREAR PEDIDO
// =====================
app.post("/api/pedido", (req, res) => {
  const { pedido, cliente, chofer, placas, valido } = req.body;

  const nuevoPedido = {
    pedido,
    cliente,
    chofer,
    placas,
    valido,
    fotos: []
  };

  pedidos.push(nuevoPedido);

  res.json({
    mensaje: "Pedido creado",
    data: nuevoPedido
  });
});

// =====================
// CONFIGURAR MULTER (fotos)
// =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// =====================
// SUBIR FOTOS
// =====================
app.post("/api/pedido/:pedido/fotos", upload.array("fotos", 50), (req, res) => {
  const { pedido } = req.params;

  const pedidoEncontrado = pedidos.find(p => p.pedido == pedido);

  if (!pedidoEncontrado) {
    return res.status(404).json({ mensaje: "Pedido no encontrado" });
  }

  req.files.forEach(file => {
    pedidoEncontrado.fotos.push(file.filename);
  });

  res.json({
    mensaje: "Fotos subidas",
    total: pedidoEncontrado.fotos.length
  });
});

// =====================
// VER PEDIDOS
// =====================
app.get("/api/pedidos", (req, res) => {
  res.json(pedidos);
});

// =====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo 🚀"));

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});
