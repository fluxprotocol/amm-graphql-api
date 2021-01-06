import { Db, FilterQuery } from "mongodb";
import { TokenStatus } from "../models/TokenStatus";

const TOKEN_STATUSES_COLLECTION_NAME = 'token_statuses';

export async function getTokenStatusesByPool(db: Db, poolId: string): Promise<TokenStatus[]> {
    try {
        const collection = db.collection<TokenStatus>(TOKEN_STATUSES_COLLECTION_NAME);
        const query: FilterQuery<TokenStatus> = {
            pool_id: poolId,
        };

        const cursor = collection.find(query).sort({ cap_creation_date: -1 });
        const statuses: TokenStatus[] = [];
        const visitedOutcomes: string[] = [];

        // Manual load to filter out duplicate data
        while (await cursor.hasNext()) {
            const status = await cursor.next();
            if (!status) continue;

            // No need to load the rest of the data
            if (visitedOutcomes.includes(status.outcome_id)) {
                break;
            }

            statuses.push(status);
            visitedOutcomes.push(status.outcome_id);
        }

        return statuses;
    } catch (error) {
        console.error('[getTokenStatusesByPool]', error);
        return [];
    }
}
