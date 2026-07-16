import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

export const INITIAL_GZIP_BASELINE_BYTES = 136_490;

const PRIVATE_ROUTE_SPECS = [
  {
    area: "login",
    source: "src/pages/login/LoginPage.tsx",
    sourceRoot: "src/pages/login/"
  },
  {
    area: "client",
    source: "src/pages/client/ClientPortal.tsx",
    sourceRoot: "src/pages/client/"
  },
  {
    area: "admin",
    source: "src/pages/admin/AdminPortal.tsx",
    sourceRoot: "src/pages/admin/"
  }
];

function fail(message) {
  throw new Error(`[bundle:check] ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeManifestPath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}

function validateManifestSchema(manifest, distRoot) {
  if (!isRecord(manifest)) {
    fail("O manifest precisa ser um objeto não nulo.");
  }

  const entries = Object.entries(manifest);

  for (const [key, chunk] of entries) {
    if (!isRecord(chunk)) {
      fail(`O chunk "${key}" precisa ser um objeto.`);
    }

    if (typeof chunk.file !== "string" || chunk.file.length === 0) {
      fail(`O campo file do chunk "${key}" precisa ser uma string não vazia.`);
    }

    for (const field of ["imports", "dynamicImports"]) {
      const value = chunk[field];
      if (
        value !== undefined &&
        (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
      ) {
        fail(`O campo ${field} do chunk "${key}" precisa ser um array de strings.`);
      }
    }

    for (const field of ["isEntry", "isDynamicEntry"]) {
      if (chunk[field] !== undefined && typeof chunk[field] !== "boolean") {
        fail(`O campo ${field} do chunk "${key}" precisa ser boolean.`);
      }
    }

    for (const field of ["name", "src"]) {
      if (chunk[field] !== undefined && typeof chunk[field] !== "string") {
        fail(`O campo ${field} do chunk "${key}" precisa ser uma string.`);
      }
    }
  }

  for (const [key, chunk] of entries) {
    for (const field of ["imports", "dynamicImports"]) {
      for (const importedKey of chunk[field] ?? []) {
        if (!Object.hasOwn(manifest, importedKey)) {
          fail(
            `O import "${importedKey}" referenciado por "${key}" em ${field} não existe no manifest.`
          );
        }
      }
    }

    const outputPath = join(distRoot, chunk.file);
    if (!existsSync(outputPath)) {
      fail(`O arquivo do chunk "${key}" não existe: ${chunk.file}.`);
    }
  }

  return entries;
}

export function validateBundle({
  manifest,
  distRoot,
  baselineBytes = INITIAL_GZIP_BASELINE_BYTES
}) {
  const entries = validateManifestSchema(manifest, distRoot);
  const entryCandidates = entries.filter(([, chunk]) => chunk.isEntry === true);

  if (entryCandidates.length !== 1) {
    fail(`Esperada uma única entry do app; encontradas ${entryCandidates.length}.`);
  }

  const [entryKey] = entryCandidates[0];

  function collectStaticGraph(key, visited = new Set()) {
    if (visited.has(key)) return visited;

    visited.add(key);
    for (const importedKey of manifest[key].imports ?? []) {
      collectStaticGraph(importedKey, visited);
    }
    return visited;
  }

  const staticGraph = collectStaticGraph(entryKey);
  const staticFiles = new Set([...staticGraph].map((key) => manifest[key].file));
  const landingCandidates = entries.filter(
    ([, chunk]) => chunk.name === "landing" && chunk.file.endsWith(".js")
  );

  if (landingCandidates.length !== 1) {
    fail(
      `Esperado exatamente um chunk JavaScript nomeado "landing"; encontrados ${landingCandidates.length}.`
    );
  }

  const [, landingChunk] = landingCandidates[0];
  if (!staticFiles.has(landingChunk.file)) {
    fail(
      `O chunk landing (${landingChunk.file}) precisa estar no grafo estático inicial para permanecer eager.`
    );
  }

  for (const [, chunk] of entries) {
    if (typeof chunk.src !== "string") continue;

    const source = normalizeManifestPath(chunk.src);
    const spec = PRIVATE_ROUTE_SPECS.find(({ sourceRoot }) =>
      source.startsWith(sourceRoot)
    );
    if (!spec || !staticFiles.has(chunk.file)) continue;

    const kind = source === spec.source ? "route entry" : "chunk auxiliar";
    fail(
      `O ${kind} da área "${spec.area}" (${chunk.file}) entrou no grafo estático inicial; a área deve permanecer lazy.`
    );
  }

  const areaFiles = { landing: landingChunk.file };

  for (const spec of PRIVATE_ROUTE_SPECS) {
    const routeEntries = entries.filter(([, chunk]) =>
      typeof chunk.src === "string" &&
      normalizeManifestPath(chunk.src) === spec.source
    );

    if (routeEntries.length !== 1) {
      fail(
        `Esperada exatamente uma route entry para "${spec.area}" (${spec.source}); encontradas ${routeEntries.length}.`
      );
    }

    const [, routeChunk] = routeEntries[0];
    if (!routeChunk.file.endsWith(".js")) {
      fail(`A route entry "${spec.area}" precisa apontar para JavaScript.`);
    }
    if (routeChunk.name !== spec.area) {
      fail(
        `A route entry "${spec.area}" precisa manter o nome de chunk "${spec.area}".`
      );
    }
    if (routeChunk.isDynamicEntry !== true) {
      fail(`A route entry "${spec.area}" precisa declarar isDynamicEntry === true.`);
    }

    areaFiles[spec.area] = routeChunk.file;
  }

  if (new Set(Object.values(areaFiles)).size !== 4) {
    fail("Landing, login, cliente e administrador precisam apontar para quatro chunks distintos.");
  }

  let initialGzipBytes = 0;
  for (const file of staticFiles) {
    if (!file.endsWith(".js")) continue;
    initialGzipBytes += gzipSync(readFileSync(join(distRoot, file))).byteLength;
  }

  if (initialGzipBytes >= baselineBytes) {
    const unit = baselineBytes === 1 ? "byte" : "bytes";
    fail(
      `JS inicial ocupa ${initialGzipBytes} bytes gzip; precisa ficar abaixo de ${baselineBytes} ${unit}.`
    );
  }

  return { areaFiles, initialGzipBytes };
}
