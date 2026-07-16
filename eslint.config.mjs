import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const productionTypeScriptFiles = ["frontend/src/**/*.{ts,tsx}"];
const nodeTypeScriptFiles = ["frontend/vite.config.ts", "frontend/tailwind.config.ts"];
const lintedTypeScriptFiles = [...productionTypeScriptFiles, ...nodeTypeScriptFiles];
const testFiles = ["frontend/src/**/*.test.{ts,tsx}", "frontend/src/test/**/*.{ts,tsx}"];

const allowOnlyImports = (allowedPrefixPattern, message) => [
  "error",
  {
    patterns: [
      {
        regex: `^(?!${allowedPrefixPattern}).+`,
        message
      }
    ]
  }
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const restrictLayerImports = (layers, message) => {
  const layerPattern = layers.map(escapeRegex).join("|");

  return [
    "error",
    {
      patterns: [
        {
          regex: `^@/(?:${layerPattern})(?:/|$)`,
          message
        },
        {
          regex: `^(?:\\./)?(?:\\.\\./)+(?:[^/]+/)*(?:${layerPattern})(?:/|$)`,
          message
        }
      ]
    }
  ];
};

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/.tmp/**",
      "**/*.tsbuildinfo",
      "tmp/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node
    }
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: lintedTypeScriptFiles
  })),
  {
    files: nodeTypeScriptFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node
    }
  },
  {
    files: productionTypeScriptFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules
    }
  },
  {
    files: testFiles,
    rules: {
      "react-refresh/only-export-components": "off"
    }
  },
  {
    files: ["frontend/src/features/portal-data/PortalDataProvider.tsx"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowExportNames: ["usePortalData"]
        }
      ]
    }
  },
  {
    files: ["frontend/src/domain/**/*.{ts,tsx}"],
    ignores: testFiles,
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "document",
          message: "O domínio deve permanecer independente do navegador."
        },
        {
          name: "fetch",
          message: "O domínio deve permanecer independente de transporte HTTP."
        },
        {
          name: "localStorage",
          message: "Persistência pertence à infraestrutura."
        },
        {
          name: "navigator",
          message: "O domínio deve permanecer independente do navegador."
        },
        {
          name: "sessionStorage",
          message: "Persistência pertence à infraestrutura."
        },
        {
          name: "window",
          message: "O domínio deve permanecer independente do navegador."
        }
      ],
      "no-restricted-imports": allowOnlyImports(
        "@/domain(?:/|$)",
        "O domínio só pode depender de outros módulos do próprio domínio."
      )
    }
  },
  {
    files: ["frontend/src/infrastructure/demo/**/*.{ts,tsx}"],
    ignores: testFiles,
    rules: {
      "no-restricted-imports": allowOnlyImports(
        "@/(?:domain|infrastructure/demo)(?:/|$)",
        "A infraestrutura demo só pode depender do domínio e de seus próprios módulos."
      )
    }
  },
  {
    files: ["frontend/src/pages/**/*.{ts,tsx}"],
    ignores: testFiles,
    rules: {
      "no-restricted-imports": restrictLayerImports(
        ["infrastructure"],
        "Páginas acessam persistência somente pela fachada portal-data."
      )
    }
  },
  {
    files: ["frontend/src/shared/**/*.{ts,tsx}"],
    ignores: testFiles,
    rules: {
      "no-restricted-imports": restrictLayerImports(
        ["app", "pages", "features", "infrastructure"],
        "Código compartilhado não pode depender de camadas de composição ou infraestrutura."
      )
    }
  }
);
