import { Db, FilterQuery } from "mongodb";
import { Claim } from "../models/Claim";

const CLAIMS_COLLECTION_NAME = 'claims';

export async function queryClaims(db: Db, query: FilterQuery<Claim>): Promise<Claim[]> {
    try {
        const collection = db.collection(CLAIMS_COLLECTION_NAME);
        const cursor = collection.find<Claim>(query).sort({ cap_creation_date: -1 })

        return cursor.toArray();
    } catch (error) {
        console.error('[queryClaims]', error);
        return [];
    }
}

export async function getClaimedEarningsForMarket(db: Db, accountId: string, marketId: string): Promise<Claim | null> {
    const claims = await queryClaims(db, {
        market_id: marketId,
        claimer: accountId,
    });

    return claims.length > 0 ? claims[0] : null;
}
