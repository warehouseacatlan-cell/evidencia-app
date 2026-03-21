const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const logoPath = path.join(__dirname, "logo.png");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// MEMORIA TEMPORAL
// =====================
let pedidos = [];

// =====================
// RUTA PRINCIPAL
// =====================
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

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
// VER PEDIDOS
// =====================
app.get("/api/pedidos", (req, res) => {
  res.json(pedidos);
});

// =====================
// CONFIGURAR MULTER
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
// GENERAR PDF
// =====================
app.get("/api/pedido/:pedido/pdf", (req, res) => {
  const { pedido } = req.params;

  const pedidoData = pedidos.find(p => p.pedido == pedido);

  if (!pedidoData) {
    return res.status(404).send("Pedido no encontrado");
  }

  const doc = new PDFDocument();

res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", `inline; filename=${pedido}.pdf`);

doc.pipe(res);

// ===== HOJA 1 =====
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, 50, 20, { width: 100 });
}

doc.moveDown(3);

doc.fontSize(20).text(`Pedido: ${pedidoData.pedido}`);
doc.moveDown();

doc.fontSize(12).text(`Cliente: ${pedidoData.cliente}`);
doc.text(`Chofer: ${pedidoData.chofer}`);
doc.text(`Placas: ${pedidoData.placas}`);
doc.text(`Válido: ${pedidoData.valido}`);

// ===== FOTOS =====
pedidoData.fotos.forEach((foto) => {
  const ruta = path.join(__dirname, "uploads", foto);

  if (fs.existsSync(ruta)) {
    doc.addPage();

    // LOGO EN CADA HOJA
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 20, { width: 100 });
    }

    doc.moveDown(3);

    doc.image(ruta, {
      fit: [500, 400],
      align: "center"
    });
  }
});

doc.end();
