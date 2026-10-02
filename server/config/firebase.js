const fs = require('fs');
const path = require('path');

let admin = null;
let firebaseInitialized = false;

try {
  admin = require('firebase-admin');

  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  const rootServiceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://codesphere-b7acd-default-rtdb.firebaseio.com'
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized with serviceAccountKey.json');
  } else if (fs.existsSync(rootServiceAccountPath)) {
    const serviceAccount = require(rootServiceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://codesphere-b7acd-default-rtdb.firebaseio.com'
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized with root serviceAccountKey.json');
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && !process.env.FIREBASE_CLIENT_EMAIL.includes('your-service-account')) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'codesphere-b7acd',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: 'https://codesphere-b7acd-default-rtdb.firebaseio.com'
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized via environment variables');
  } else {
    console.log('Firebase Admin: No valid serviceAccountKey.json or environment credentials found yet.');
  }
} catch (error) {
  console.log('Firebase Admin initialization skipped or package not installed:', error.message);
}

module.exports = {
  admin,
  firebaseInitialized
};
