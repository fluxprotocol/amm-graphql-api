import { Db, FilterQuery } from "mongodb";
import { Pool } from "../models/Pool";

const POOLS_COLLECTION_NAME = "pools";


export async function getPoolById(db: Db, id: string): Promise<Pool | null> {
    try {
        const collection = db.collection(POOLS_COLLECTION_NAME);
        const query: FilterQuery<Pool> = {
            id,
        };

        return collection.findOne<Pool>(query, {
            sort: {
                // Always get the latest entry
                cap_creation_date: -1,
            }
        });
    } catch (error) {
        console.error('[getPoolById]', error);
        return null;
    }
}

