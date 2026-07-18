import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";
import { validateBundle } from "./bundle-checker.mjs";

const temporaryDirectories = [];

function createValidManifest() {
  return {
    "_landing.js": {
      file: "assets/landing-fixture.js",
      name: "landing",
      imports: ["_runtime.js", "_shared-ui.js"]
    },
    "_runtime.js": {
      file: "assets/runtime-fixture.js",
      name: "runtime"
    },
    "_shared-ui.js": {
      file: "assets/shared-ui-fixture.js",
      name: "shared-ui",
      imports: ["_runtime.js"]
    },
    "index.html": {
      file: "assets/index-fixture.js",
      name: "index",
      src: "index.html",
      isEntry: true,
      imports: ["_runtime.js", "_landing.js"],
      dynamicImports: [
        "src/pages/login/LoginPage.tsx",
        "src/pages/client/ClientPortal.tsx",
        "src/pages/admin/AdminPortal.tsx"
      ]
    },
    "src/pages/login/LoginPage.tsx": {
      file: "assets/login-fixture.js",
      name: "login",
      src: "src/pages/login/LoginPage.tsx",
      isDynamicEntry: true,
      imports: ["_runtime.js", "_shared-ui.js"]
    },
    "src/pages/client/ClientPortal.tsx": {
      file: "assets/client-fixture.js",
      name: "client",
      src: "src/pages/client/ClientPortal.tsx",
      isDynamicEntry: true,
      imports: ["_runtime.js", "_shared-ui.js"]
    },
    "src/pages/admin/AdminPortal.tsx": {
      file: "assets/admin-fixture.js",
      name: "admin",
      src: "src/pages/admin/AdminPortal.tsx",
      isDynamicEntry: true,
      imports: ["_runtime.js", "_shared-ui.js"]
    }
  };
}

function createFixtureRoot() {
  const distRoot = mkdtempSync(join(tmpdir(), "vertice-bundle-check-"));
  temporaryDirectories.push(distRoot);
  return distRoot;
}

function createFixture(manifest, { omitFiles = [] } = {}) {
  const distRoot = createFixtureRoot();

  for (const chunk of Object.values(manifest)) {
    if (!chunk || typeof chunk.file !== "string" || omitFiles.includes(chunk.file)) {
      continue;
    }

    const outputPath = join(distRoot, chunk.file);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `export const fixture = ${JSON.stringify(chunk.name ?? "chunk")};\n`);
  }

  return distRoot;
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    rmSync(temporaryDirectories.pop(), { recursive: true, force: true });
  }
});

test("accepts one eager landing and three distinct lazy route entries", () => {
  const manifest = createValidManifest();
  const distRoot = createFixture(manifest);

  const result = validateBundle({ manifest, distRoot, baselineBytes: 136_490 });

  assert.deepEqual(result.areaFiles, {
    landing: "assets/landing-fixture.js",
    login: "assets/login-fixture.js",
    client: "assets/client-fixture.js",
    admin: "assets/admin-fixture.js"
  });
  assert.ok(result.initialGzipBytes < 136_490);
});

test("allows auxiliary private chunks when they stay outside the initial graph", () => {
  const manifest = createValidManifest();
  manifest["src/pages/login/LoginForm.tsx"] = {
    file: "assets/login-form-fixture.js",
    name: "login-form",
    src: "src/pages/login/LoginForm.tsx",
    imports: ["_runtime.js", "_shared-ui.js"]
  };
  manifest["src/pages/login/LoginPage.tsx"].imports.push("src/pages/login/LoginForm.tsx");
  const distRoot = createFixture(manifest);

  assert.doesNotThrow(() => validateBundle({ manifest, distRoot }));
});

test("rejects duplicate exact route entries", () => {
  const manifest = createValidManifest();
  manifest["_duplicate-login-entry.js"] = {
    ...manifest["src/pages/login/LoginPage.tsx"],
    file: "assets/login-duplicate-fixture.js"
  };
  const distRoot = createFixture(manifest);

  assert.throws(
    () => validateBundle({ manifest, distRoot }),
    /exatamente uma route entry para "login".*encontradas 2/i
  );
});

test("requires every private route entry to be dynamic", () => {
  const manifest = createValidManifest();
  manifest["src/pages/client/ClientPortal.tsx"].isDynamicEntry = false;
  const distRoot = createFixture(manifest);

  assert.throws(
    () => validateBundle({ manifest, distRoot }),
    /route entry "client".*isDynamicEntry === true/i
  );
});

test("rejects an auxiliary private chunk in the initial graph", () => {
  const manifest = createValidManifest();
  manifest["src/pages/login/LoginForm.tsx"] = {
    file: "assets/login-form-eager-fixture.js",
    name: "login-form",
    src: "src/pages/login/LoginForm.tsx",
    imports: ["_runtime.js"]
  };
  manifest["index.html"].imports.push("src/pages/login/LoginForm.tsx");
  const distRoot = createFixture(manifest);

  assert.throws(
    () => validateBundle({ manifest, distRoot }),
    /chunk auxiliar da área "login".*login-form-eager-fixture\.js.*grafo estático inicial/i
  );
});

test("validates the manifest schema before reading its chunks", () => {
  const invalidCases = [
    {
      label: "manifest null",
      manifest: null,
      expected: /\[bundle:check\].*manifest.*objeto não nulo/i
    },
    {
      label: "manifest array",
      manifest: [],
      expected: /\[bundle:check\].*manifest.*objeto não nulo/i
    },
    {
      label: "chunk null",
      manifest: { ...createValidManifest(), "index.html": null },
      expected: /\[bundle:check\].*chunk "index\.html".*objeto/i
    },
    {
      label: "file is not a string",
      manifest: {
        ...createValidManifest(),
        "index.html": { ...createValidManifest()["index.html"], file: 42 }
      },
      expected: /\[bundle:check\](?=.*chunk "index\.html")(?=.*file)(?=.*string)/i
    },
    {
      label: "imports is not a string array",
      manifest: {
        ...createValidManifest(),
        "index.html": { ...createValidManifest()["index.html"], imports: [42] }
      },
      expected: /\[bundle:check\](?=.*chunk "index\.html")(?=.*imports)(?=.*array de strings)/i
    },
    {
      label: "dynamicImports is not an array",
      manifest: {
        ...createValidManifest(),
        "index.html": {
          ...createValidManifest()["index.html"],
          dynamicImports: "src/pages/login/LoginPage.tsx"
        }
      },
      expected:
        /\[bundle:check\](?=.*chunk "index\.html")(?=.*dynamicImports)(?=.*array de strings)/i
    },
    {
      label: "isEntry is not boolean",
      manifest: {
        ...createValidManifest(),
        "index.html": { ...createValidManifest()["index.html"], isEntry: "true" }
      },
      expected: /\[bundle:check\](?=.*chunk "index\.html")(?=.*isEntry)(?=.*boolean)/i
    },
    {
      label: "isDynamicEntry is not boolean",
      manifest: {
        ...createValidManifest(),
        "src/pages/login/LoginPage.tsx": {
          ...createValidManifest()["src/pages/login/LoginPage.tsx"],
          isDynamicEntry: 1
        }
      },
      expected: /\[bundle:check\](?=.*LoginPage\.tsx)(?=.*isDynamicEntry)(?=.*boolean)/i
    }
  ];

  for (const { label, manifest, expected } of invalidCases) {
    const distRoot = createFixtureRoot();
    assert.throws(
      () => validateBundle({ manifest, distRoot }),
      expected,
      `schema inválido aceito: ${label}`
    );
  }
});

test("rejects a manifest import that does not exist", () => {
  const manifest = createValidManifest();
  manifest["index.html"].imports.push("_missing-runtime.js");
  const distRoot = createFixture(manifest);

  assert.throws(
    () => validateBundle({ manifest, distRoot }),
    /\[bundle:check\].*import "_missing-runtime\.js".*referenciado por "index\.html".*não existe/i
  );
});

test("rejects a manifest output file that is missing", () => {
  const manifest = createValidManifest();
  const missingFile = manifest["src/pages/admin/AdminPortal.tsx"].file;
  const distRoot = createFixture(manifest, { omitFiles: [missingFile] });

  assert.throws(
    () => validateBundle({ manifest, distRoot }),
    /\[bundle:check\](?=.*arquivo)(?=.*admin-fixture\.js)(?=.*não existe)/i
  );
});

test("rejects initial JavaScript at or above the gzip limit", () => {
  const manifest = createValidManifest();
  const distRoot = createFixture(manifest);

  assert.throws(
    () => validateBundle({ manifest, distRoot, baselineBytes: 1 }),
    /\[bundle:check\].*JS inicial ocupa.*abaixo de 1 byte/i
  );
});
