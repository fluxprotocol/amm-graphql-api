import { Db } from 'mongodb';
import migrations from './migrations';

const MIGRATIONS_COLLECTION = 'api_migrations';

export default async function executeMigrations(db: Db) {
    const collection = db.collection(MIGRATIONS_COLLECTION);
    const executedMigrations = (await collection.find().toArray()).map(doc => doc.id);

    console.log('🏃 Starting migrations');

    for (const migration of migrations) {
        const migrationInstance = new migration();

        if (executedMigrations.includes(migrationInstance.id)) continue;

        console.log(`🤖 executing migration ${migrationInstance.id}`);
        await migrationInstance.execute(db);
        collection.insertOne({
            id: migrationInstance.id,
            date: new Date(),
        });
    }

    console.log('✅ Completed migrations');
}
