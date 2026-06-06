import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('\x1b[33m%s\x1b[0m', '🤖 CLI de Curación de Catálogos con LangGraph');
    console.log('Uso: node scripts/curate-pdf.js <ruta_al_archivo.pdf>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`\x1b[31mError: El archivo no existe en la ruta: "${absolutePath}"\x1b[0m`);
    process.exit(1);
  }

  console.log(`📖 Leyendo archivo: ${path.basename(absolutePath)}...`);
  const buffer = fs.readFileSync(absolutePath);

  try {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    console.log(`\x1b[32m✅ Texto extraído (${pdfData.numpages} páginas, ${text.length} caracteres)\x1b[0m`);

    console.log('🚀 Enviando al Sandbox de LangGraph para Curación...');
    const response = await fetch('http://localhost:3000/api/v1/agents/curate-catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Servidor devolvió ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n\x1b[36m==================================================\x1b[0m');
    console.log('\x1b[36m📊 REPORTE DE CURACIÓN DEL AGENTE\x1b[0m');
    console.log('\x1b[36m==================================================\x1b[0m');
    console.log(`Aprobado: ${result.success ? '\x1b[32mSI ✅\x1b[0m' : '\x1b[31mNO ❌\x1b[0m'}`);
    console.log(`Iteraciones del Ciclo: ${result.iterations}`);
    console.log(`Conflictos Detectados: ${result.conflicts.length}`);
    if (result.conflicts.length > 0) {
      result.conflicts.forEach((c, idx) => console.log(`  - \x1b[33m[Conflicto ${idx + 1}]:\x1b[0m ${c}`));
    }
    console.log('\n\x1b[34m📦 Elementos Extraídos/Curados:\x1b[0m');
    console.log(JSON.stringify(result.items, null, 2));
    console.log('\x1b[36m==================================================\x1b[0m\n');

  } catch (error) {
    console.error('\x1b[31m❌ Falló la curación del PDF:\x1b[0m', error.message);
    process.exit(1);
  }
}

main();
