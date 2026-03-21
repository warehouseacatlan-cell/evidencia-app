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
// SUBIR FOTOS + CREAR PEDIDO AUTOMÁTICO
// =====================
app.post("/api/pedido/:pedido/fotos", upload.array("fotos", 50), (req, res) => {
  const { pedido } = req.params;
  const { cliente, chofer, placas, valido } = req.body;

  console.log("RECIBIENDO PEDIDO:", pedido);

  // Buscar si ya existe
  let pedidoEncontrado = pedidos.find(p => p.pedido === String(pedido));

  // Si no existe, crearlo automáticamente
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
    console.log("✅ Pedido creado automáticamente");
  }

  // Guardar fotos
  req.files.forEach(file => {
    pedidoEncontrado.fotos.push(file.filename);
  });

  console.log("📸 Fotos guardadas:", pedidoEncontrado.fotos);

  res.json({
    mensaje: "Fotos subidas y pedido listo",
    pedido: pedidoEncontrado
  });
});

// =====================
// GENERAR PDF
// =====================
app.get("/api/pedido/:pedido/pdf", (req, res) => {
  const { pedido } = req.params;

  console.log("GENERANDO PDF:", pedido);

  const pedidoData = pedidos.find(p => p.pedido === String(pedido));

  if (!pedidoData) {
    return res.status(404).send("Pedido no encontrado");
  }

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${pedido}.pdf`);

  doc.pipe(res);

  // HOJA 1
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

  // FOTOS
  pedidoData.fotos.forEach((foto) => {
    const ruta = path.join(__dirname, "uploads", foto);

    if (fs.existsSync(ruta)) {
      doc.addPage();

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
});

// =====================
// INICIAR SERVIDOR
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
