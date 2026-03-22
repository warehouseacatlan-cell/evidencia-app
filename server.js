const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
const logoPath = path.join(__dirname, "logo.png");

// Crear carpeta uploads si no existe
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 🔥 SERVIR HTML

let pedidos = [];

// =====================
// RUTA PRINCIPAL (HTML)
// =====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =====================
// MULTER
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
  const { cliente, chofer, placas, valido } = req.body;

  let pedidoEncontrado = pedidos.find(p => p.pedido === String(pedido));

  if (!pedidoEncontrado) {
    pedidoEncontrado = {
      pedido: String(pedido),
      cliente: cliente || "N/A",
      chofer: chofer || "N/A",
      placas: placas || "N/A",
      valido: valido || "N/A",
      fotos: []
    };
    pedidos.push(pedidoEncontrado);
  }

  req.files.forEach(file => {
    pedidoEncontrado.fotos.push(file.filename);
  });

  res.json({
    mensaje: "OK",
    pedido: pedidoEncontrado
  });
});

// =====================
// PDF
// =====================
app.get("/api/pedido/:pedido/pdf", (req, res) => {
  const { pedido } = req.params;

  const pedidoData = pedidos.find(p => p.pedido === String(pedido));

  if (!pedidoData) {
    return res.status(404).send("Pedido no encontrado");
  }

  const doc = new PDFDocument({ margin: 50 });

  const fecha = new Date().toISOString().split("T")[0];
  const clienteLimpio = pedidoData.cliente.replace(/\s+/g, "_");
  const nombrePDF = `Pedido_${clienteLimpio}_${pedido}_${fecha}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${nombrePDF}`);

  doc.pipe(res);

  const agregarLogo = () => {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 20, { width: 100 });
      }
    } catch (e) {}
  };

  // HOJA 1
  agregarLogo();
  doc.moveDown(4);

  doc.fontSize(18).text("EVIDENCIA DE ENTREGA", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Pedido: ${pedidoData.pedido}`);
  doc.text(`Cliente: ${pedidoData.cliente}`);
  doc.text(`Chofer: ${pedidoData.chofer}`);
  doc.text(`Placas: ${pedidoData.placas}`);
  doc.text(`Valido: ${pedidoData.valido}`);

  // FOTOS
  pedidoData.fotos.forEach((foto, i) => {
    const ruta = path.join(__dirname, "uploads", foto);

    if (fs.existsSync(ruta)) {
      doc.addPage();
      agregarLogo();

      doc.moveDown(4);
      doc.text(`Evidencia ${i + 1}`, { align: "center" });
      doc.moveDown();

      try {
        doc.image(ruta, {
          fit: [450, 350],
          align: "center"
        });
      } catch (e) {}
    }
  });

  doc.end();
});

// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo");
});
