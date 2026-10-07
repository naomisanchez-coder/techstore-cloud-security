// Genera un código numérico aleatorio de 6 dígitos
function generateMfaCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateMfaCode };