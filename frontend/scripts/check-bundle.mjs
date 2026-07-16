import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  INITIAL_GZIP_BASELINE_BYTES,
  validateBundle
} from "./bundle-checker.mjs";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(frontendRoot, "dist");
const manifestPath = join(distRoot, ".vite", "manifest.json");

function fail(message) {
  throw new Error(`[bundle:check] ${message}`);
}

if (!existsSync(manifestPath)) {
  fail(
    `Manifest não encontrado em ${manifestPath}. Execute o build com build.manifest habilitado.`
  );
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`Não foi possível ler o manifest: ${error.message}`);
}

const result = validateBundle({
  manifest,
  distRoot,
  baselineBytes: INITIAL_GZIP_BASELINE_BYTES
});
const chunkSummary = Object.entries(result.areaFiles)
  .map(([area, file]) => `${area}=${file}`)
  .join(", ");

console.log(`[bundle:check] Chunks: ${chunkSummary}`);
console.log(
  `[bundle:check] JS estático inicial: ${result.initialGzipBytes} bytes gzip (baseline: ${INITIAL_GZIP_BASELINE_BYTES} bytes).`
);
