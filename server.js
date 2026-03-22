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
let pedidos = [];

// =====================
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

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
    mensaje: "Fotos subidas y pedido listo",
    pedido: pedidoEncontrado
  });
});

// =====================
app.get("/api/pedido/:pedido/pdf", (req, res) => {
  const { pedido } = req.params;

  const pedidoData = pedidos.find(p => p.pedido === String(pedido));

  if (!pedidoData) {
    return res.status(404).send("Pedido no encontrado");
  }

  const doc = new PDFDocument();

  const fecha = new Date().toISOString().split("T")[0];

const clienteLimpio = pedidoData.cliente.replace(/\s+/g, "_");

const nombrePDF = `Pedido_${clienteLimpio}_${pedido}_${fecha}.pdf`;

res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", `inline; filename=${nombrePDF}`);
  doc.pipe(res);

  // 🔥 LOGO SEGURO (NO ROMPE)
  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 20, { width: 100 });
    }
  } catch (err) {
    console.log("Error cargando logo:", err.message);
  }

  doc.moveDown(3);

  doc.fontSize(20).text(`Pedido: ${pedidoData.pedido}`);
  doc.moveDown();

  doc.fontSize(12).text(`Cliente: ${pedidoData.cliente}`);
  doc.text(`Chofer: ${pedidoData.chofer}`);
  doc.text(`Placas: ${pedidoData.placas}`);
  doc.text(`Válido: ${pedidoData.valido}`);

  pedidoData.fotos.forEach((foto) => {
    const ruta = path.join(__dirname, "uploads", foto);

    if (fs.existsSync(ruta)) {
      doc.addPage();

      // 🔥 LOGO SEGURO EN CADA HOJA
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 20, { width: 100 });
        }
      } catch (err) {
        console.log("Error logo página:", err.message);
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
