import { Cursor, Db, FilterQuery } from "mongodb";
import { Balance } from "../models/Balance";
import { Pool } from "../models/Pool";
import { getBalancesByAccountId } from "./UserBalanceService";

const POOLS_COLLECTION_NAME = "pools";

async function filterDuplicatePools(cursor: Cursor<Pool>) {
    const pools: Pool[] = [];
    const visitedIds: string[] = [];

    // Manual load to filter out duplicate data
    while (await cursor.hasNext()) {
        const pool = await cursor.next();
        if (!pool) continue;

        if (visitedIds.includes(pool.id)) {
            continue;
        }

        pools.push(pool);
        visitedIds.push(pool.id);
    }

    return pools;
}

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

        return filterDuplicatePools(cursor);
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

export async function getPoolTokensForAccountId(db: Db, accountId: string): Promise<Balance[]> {
    try {
        const balances = await getBalancesByAccountId(db, accountId);
        const poolIds: string[] = [];

        balances.forEach((balance) => {
            if (!poolIds.includes(balance.pool_id)) {
                poolIds.push(balance.pool_id);
            }
        });

        const pools = await getPoolsByIds(db, poolIds);
        return balances.filter(balance => {
            const pool = pools.find(pool => pool.id === balance.pool_id);

            return pool?.num_of_outcomes === balance.outcome_id;
        });
    } catch (error) {
        console.error('[getPoolTokensByAccountId]', error);
        return [];
    }
}

