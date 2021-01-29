import { Cursor, Db, FilterQuery } from "mongodb";
import { Balance } from "../models/Balance";
import { Pool } from "../models/Pool";
import { getBalancesByAccountId } from "./UserBalanceService";

const POOLS_COLLECTION_NAME = "pools";

export async function getPoolsByIds(db: Db, ids: string[]): Promise<Pool[]> {
    try {
        const collection = db.collection(POOLS_COLLECTION_NAME);
        const query: FilterQuery<Pool> = {
            id: {
                $in: ids,
            },
        };

        const cursor = collection.find<Pool>(query, {
            sort: {
                // Always get the latest entry
                cap_creation_date: -1,
            }
        });

        return cursor.toArray();
    } catch (error) {
        console.error('[getPoolsByIds]', error);
        return [];
    }
}

export async function getPoolById(db: Db, id: string): Promise<Pool | null> {
    try {
        const collection = db.collection(POOLS_COLLECTION_NAME);
        const query: FilterQuery<Pool> = {
            id,
        };

        return collection.findOne<Pool>(query);
    } catch (error) {
        console.error('[getPoolById]', error);
        return null;
    }
}

export async function getPoolTokensForAccountId(db: Db, accountId: string, poolId?: string): Promise<Balance[]> {
    try {
        const balances = await getBalancesByAccountId(db, accountId, poolId);
        const poolIds: string[] = [];

        balances.forEach((balance) => {
            if (!poolIds.includes(balance.pool_id)) {
                poolIds.push(balance.pool_id);
            }
        });

        const pools = await getPoolsByIds(db, poolIds);
        return balances.filter(balance => {
            const pool = pools.find(pool => pool.id === balance.pool_id);

            return pool?.outcomes === balance.outcome_id;
        });
    } catch (error) {
        console.error('[getPoolTokensByAccountId]', error);
        return [];
    }
}

