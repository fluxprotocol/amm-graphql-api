import { Db, FilterQuery } from "mongodb";
import { EscrowStatus } from "../models/EscrowStatus";

const ESCROW_STATUSES_COLLECTION_NAME = 'escrow_statuses';

export async function queryEscrowStatuses(db: Db, query: FilterQuery<EscrowStatus>): Promise<EscrowStatus[]> {
    try {
        const collection = db.collection(ESCROW_STATUSES_COLLECTION_NAME);
        const cursor = collection.find<EscrowStatus>(query);

        return cursor.toArray();
    } catch (error) {
        console.error('[queryEscrowStatuses]', error);
        return [];
    }
}

export async function getEscrowStatusForAccountByMarket(db: Db, accountId: string, marketId?: string): Promise<EscrowStatus[]> {
    const query: FilterQuery<EscrowStatus> = {
        account_id: accountId,
    }
    if (marketId) {
        query.market_id = marketId
    }
    return queryEscrowStatuses(db, query);
}
