import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// --- PEGA AQUÍ LA CONFIGURACIÓN QUE COPIASTE DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSy8p5VxDtf3W1U9V3ITBp7Bd8GMcXeI7PM",
  authDomain: "compualarma-admin.firebaseapp.com",
  databaseURL: "https://compualarma-admin.firebaseio.com",
  projectId: "compualarma-admin",
  storageBucket: "compualarma-admin.firebasestorage.app",
  messagingSenderId: "84362526394",
  appId: "1:84362526394:web:e9a7aa4706bba0ac688c83"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar los servicios que usarás
// ESTA ES LA PARTE CLAVE: NOS ASEGURAMOS DE EXPORTAR LAS CONEXIONES INICIALIZADAS
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage };
