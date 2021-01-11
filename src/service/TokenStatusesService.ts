import { Cursor, Db, FilterQuery } from "mongodb";
import { TokenInfoViewModel, transformToTokenInfoViewModel } from "../models/TokenInfoViewModel";
import { TokenStatus } from "../models/TokenStatus";
import { getPoolById } from "./PoolService";

const TOKEN_STATUSES_COLLECTION_NAME = 'token_statuses';

async function filterDuplicateTokensInfo(cursor: Cursor<TokenStatus>): Promise<TokenStatus[]> {
    const statuses: TokenStatus[] = [];
    const visitedOutcomes: number[] = [];

    while (await cursor.hasNext()) {
        const status = await cursor.next();
        if (!status) continue;

        if (visitedOutcomes.includes(status.outcome_id)) {
            continue;
        }

        statuses.push(status);
        visitedOutcomes.push(status.outcome_id);
    }

    return statuses;
}

export async function getTokensInfoByPool(db: Db, poolId: string): Promise<TokenInfoViewModel[]> {
    try {
        const pool = await getPoolById(db, poolId);

        if (!pool) {
            return [];
        }

        const collection = db.collection<TokenStatus>(TOKEN_STATUSES_COLLECTION_NAME);
        const query: FilterQuery<TokenStatus> = {
            pool_id: poolId,
        };

        const cursor = collection.find(query).sort({ cap_creation_date: -1 });
        const statuses = await filterDuplicateTokensInfo(cursor);

        return statuses.map(tokenStatus => transformToTokenInfoViewModel(tokenStatus, pool));
    } catch (error) {
        console.error('[getTokenInfoByPool]', error);
        return [];
    }
}

export async function getTokenInfo(db: Db, poolId: string, outcomeId: number): Promise<TokenStatus | null> {
    try {
        const collection = db.collection(TOKEN_STATUSES_COLLECTION_NAME);
        const query: FilterQuery<TokenStatus> = {
            pool_id: poolId,
            outcome_id: outcomeId
        };

        return collection.findOne<TokenStatus>(query, {
            sort: {
                // Always get the latest entry
                cap_creation_date: -1,
            }
        });
    } catch (error) {
        console.error('[getTokenInfo]', error);
        return null;
    }
}

/**
 * Fetches multiple tokens statuses by different conditions
 * This increases performance instead of making multiple database calls
 *
 * @export
 * @param {Db} db
 * @param {Partial<TokenStatus>[]} conditions
 * @return {Promise<TokenStatus[]>}
 */
export async function getTokensInfoByCondition(db: Db, conditions: Partial<TokenStatus>[]): Promise<TokenStatus[]> {
    try {
        const collection = db.collection<TokenStatus>(TOKEN_STATUSES_COLLECTION_NAME);
        const query: FilterQuery<TokenStatus> = {
            $or: conditions,
        };

        const cursor = collection.find(query).sort({ cap_creation_date: -1 });

        return filterDuplicateTokensInfo(cursor);
    } catch (error) {
        console.error('[queryTokensInfo]', error);
        return [];
    }
}
