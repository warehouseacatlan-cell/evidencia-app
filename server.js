const express = require("express");
const multer = require("multer");
const fs = require("fs");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===== CONFIGURACIÓN ===== */

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB por imagen
});

/* ===== ENDPOINT ===== */

app.post("/generar", upload.array("fotos", 50), async (req, res) => {

  try {

    const { pedido, cliente, operador, placas } = req.body;

    /* ===== HTML BASE ===== */

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial; padding: 20px; }
        h2 { text-align: center; }
        .info { margin-bottom: 10px; }
        img { width: 300px; margin: 10px; }
      </style>
    </head>
    <body>

    <h2>EVIDENCIA DE CARGA</h2>

    <div class="info"><b>Pedido:</b> ${pedido || ""}</div>
    <div class="info"><b>Cliente:</b> ${cliente || ""}</div>
    <div class="info"><b>Operador:</b> ${operador || ""}</div>
    <div class="info"><b>Placas:</b> ${placas || ""}</div>

    <hr>
    `;

    /* ===== AGREGAR IMÁGENES ===== */

    for (let file of req.files) {

      const imgBuffer = fs.readFileSync(file.path);
      const base64 = imgBuffer.toString("base64");

      html += `
        <div>
          <img src="data:image/jpeg;base64,${base64}">
        </div>
      `;
    }

    html += `
    </body>
    </html>
    `;

    /* ===== GENERAR PDF ===== */

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await page.close();
    await browser.close();

    /* ===== LIMPIAR ARCHIVOS TEMPORALES ===== */

    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    /* ===== ENVIAR PDF ===== */

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Evidencia_${pedido || "SIN_PEDIDO"}.pdf"`
    );

    res.end(pdfBuffer);

  } catch (error) {

    console.error("ERROR:", error);

    res.status(500).json({
      error: "Error generando PDF",
      detalle: error.message
    });

  }

});

/* ===== SERVIDOR ===== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});