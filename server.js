const express = require("express");
const cors = require("cors");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
const logoPath = path.join(__dirname, "logo.png");

// Crear carpeta uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =====================
let pedidos = [];

// =====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
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
// GENERAR PDF PRO
// =====================
app.get("/api/pedido/:pedido/pdf", (req, res) => {
  const { pedido } = req.params;

  const pedidoData = pedidos.find(p => p.pedido === String(pedido));
  if (!pedidoData) {
    return res.status(404).send("Pedido no encontrado");
  }

  const doc = new PDFDocument({ margin: 40 });

  const fecha = new Date().toISOString().split("T")[0];
  const clienteLimpio = pedidoData.cliente.replace(/\s+/g, "_");
  const nombrePDF = `Pedido_${clienteLimpio}_${pedido}_${fecha}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${nombrePDF}`);

  doc.pipe(res);

  const agregarLogo = () => {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 20, { width: 100 });
      }
    } catch (e) {}
  };

  // =====================
  // HOJA 1 (FORMATO)
  // =====================
  agregarLogo();

  doc.moveDown(4);

  doc
    .fontSize(20)
    .text("EVIDENCIA DE ENTREGA", { align: "center" });

  doc.moveDown(2);

  const y = doc.y;

  doc.fontSize(14);

  doc.text(`Pedido: ${pedidoData.pedido}`, 60, y);
  doc.text(`Cliente: ${pedidoData.cliente}`, 60, y + 50);
  doc.text(`Chofer: ${pedidoData.chofer}`, 60, y + 100);
  doc.text(`Placas: ${pedidoData.placas}`, 60, y + 150);
  doc.text(`Válido: ${pedidoData.valido}`, 60, y + 200);

  // =====================
  // FOTOS 4 POR HOJA
  // =====================
  const fotos = pedidoData.fotos;

  const posiciones = [
    { x: 50, y: 80 },
    { x: 300, y: 80 },
    { x: 50, y: 320 },
    { x: 300, y: 320 }
  ];

  let index = 0;

  while (index < fotos.length) {
    doc.addPage();
    agregarLogo();

    for (let i = 0; i < 4 && index < fotos.length; i++, index++) {
      const ruta = path.join(__dirname, "uploads", fotos[index]);

      if (fs.existsSync(ruta)) {
        try {
          doc.image(ruta, posiciones[i].x, posiciones[i].y, {
            fit: [220, 200]
          });
        } catch (e) {
          console.log("Error imagen:", e.message);
        }
      }
    }
  }

  doc.end();
});

// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 🚀");
});
