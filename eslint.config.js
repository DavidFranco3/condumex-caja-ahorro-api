const neostandard = require('neostandard')
const globals = require('globals')
const prettierConfig = require('eslint-config-prettier')

// TUS CONSTANTES
const RULES = {
  OFF: "off",
  WARN: "warn",
  ERROR: "error",
};

module.exports = [
  // 1. Ignorar carpetas de compilación (CRUCIAL para evitar los 21,000 errores)
  {
    ignores: ['dist', 'build', 'node_modules', 'coverage', '*.min.js']
  },

  // 2. Base de Standard (neostandard reemplaza a 'extends: standard')
  ...neostandard(),

  // 3. Tu configuración personalizada
  {
    languageOptions: {
      ecmaVersion: 12, // Equivalente a 2021
      sourceType: 'module',
      globals: {
        ...globals.node,    // Reemplaza a env: { node: true }
        ...globals.es2021,  // Reemplaza a env: { es2021: true }
        
        // Variables globales extra para que no marquen error
        Swal: 'readonly',
        moment: 'readonly',
        test: 'readonly',
        expect: 'readonly'
      },
    },
    
    // TUS REGLAS
    rules: {
      // Tu regla solicitada
      "no-console": RULES.OFF,

      // --- REGLAS DE MIGRACIÓN (Para evitar los errores que acabamos de limpiar) ---
      
      // Lógica
      "no-unused-vars": RULES.WARN, // Variables no usadas en amarillo
      "no-undef": RULES.ERROR,      // Variables no definidas en rojo
      "eqeqeq": RULES.WARN,         // Comparaciones estrictas en amarillo

      // Estilo (Apagamos lo que te daba problemas con los ternarios y escapes)
      "@stylistic/multiline-ternary": RULES.OFF,
      "no-useless-escape": RULES.OFF,
      "import-x/no-duplicates": RULES.WARN,
      "@stylistic/jsx-closing-tag-location": RULES.WARN,
      "@stylistic/jsx-indent": RULES.OFF,
      "new-cap": RULES.OFF // Ignorar mayúsculas en constructores (para jsPDF)
    },
  },

  // 4. Prettier al final (Desactiva reglas de estilo de Standard que chocan con Prettier)
  prettierConfig,
];