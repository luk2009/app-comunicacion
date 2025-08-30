import Dexie from 'dexie';

export const db = new Dexie('comunicadorDB');

// Versión 1: Schema inicial
db.version(1).stores({
  categories: '++id, name',
  images: '++id, categoryId, name, imageData',
});

// Versión 2: Añadimos order pero con índice único (problemático)
db.version(2).stores({
  categories: '++id, name, &order',
  images: '++id, categoryId, name, imageData, &order', 
});

// Versión 3: Corrige el índice de imágenes
db.version(3).stores({
  images: '++id, categoryId, name, imageData, order',
});

// VERSIÓN 4: Corrige el índice de categorías (NUEVA)
db.version(4).stores({
  categories: '++id, name, order', // Sin '&' para permitir valores temporalmente duplicados
});

// Función de población inicial
export async function populateInitialData() {
  db.transaction('rw', db.categories, db.images, async () => {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      console.log("Base de datos vacía, añadiendo datos iniciales...");
      
      const categoriesToAdd = [
        { name: 'Comida', order: 1 },
        { name: 'Actividades', order: 2 },
        { name: 'Personal', order: 3 },
        { name: 'Sentimientos', order: 4 },
      ];
      const addedCategories = await db.categories.bulkAdd(categoriesToAdd, { allKeys: true });

      const imagesToAdd = [
        { categoryId: addedCategories[0], name: 'Manzana', imageData: null, order: 1 },
        { categoryId: addedCategories[0], name: 'Agua', imageData: null, order: 2 },
        { categoryId: addedCategories[1], name: 'Jugar', imageData: null, order: 1 },
        { categoryId: addedCategories[1], name: 'Parque', imageData: null, order: 2 },
        { categoryId: addedCategories[2], name: 'Baño', imageData: null, order: 1 },
        { categoryId: addedCategories[3], name: 'Feliz', imageData: null, order: 1 },
      ];
      await db.images.bulkAdd(imagesToAdd);

      console.log("Datos iniciales añadidos correctamente.");
    }
  }).catch(e => {
    console.error('Error en la transacción de población:', e);
  });
}