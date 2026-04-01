import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: admin.app.App | null = null;

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

    console.log('📌 Firebase inicializado correctamente');
  } catch (error: any) {
    console.warn('⚠️ Error al inicializar Firebase:', error.message);
  }
} else {
  console.warn('⚠️ Firebase no está configurado. Las notificaciones push no funcionarán.');
}

export default admin;