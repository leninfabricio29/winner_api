import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: admin.app.App | null = null;
let isFirebaseInitialized = false;

if (process.env.FIREBASE_CREDENTIALS_BASE64) {
  try {
    const decodedBase64 = Buffer
      .from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64')
      .toString('utf8');

    const serviceAccount = JSON.parse(decodedBase64) as admin.ServiceAccount;

    // Arreglar saltos de línea en la private_key
    if (serviceAccount.privateKey) {
      serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin SDK inicializado correctamente');
  } catch (error: any) {
    isFirebaseInitialized = false;
    console.error('❌ Error al inicializar Firebase:', error.message);
  }
} else {
  isFirebaseInitialized = false;
  console.error('❌ FIREBASE_CREDENTIALS_BASE64 no está configurado. Las notificaciones push NO funcionarán.');
  console.error('   Configura esta variable de entorno en tu archivo .env');
}

// Exportar función para validar que Firebase esté listo
export function isFirebaseReady(): boolean {
  return isFirebaseInitialized && firebaseApp !== null;
}

export default admin;