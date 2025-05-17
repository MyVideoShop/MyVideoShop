// utils/b2.js
const B2 = require('backblaze-b2');
const dotenv = require('dotenv');
dotenv.config();

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

// Authentifiziere dich sofort beim Laden der Datei
async function authorizeB2() {
  try {
    await b2.authorize();
    console.log('✅ Mit Backblaze B2 verbunden.');
  } catch (error) {
    console.error('❌ Fehler beim Verbinden mit Backblaze B2:', error.message);
  }
}

authorizeB2();

module.exports = b2;
