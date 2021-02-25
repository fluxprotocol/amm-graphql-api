import { Db, FilterQuery } from "mongodb";
import { MarketAccountStatus } from "../models/MarketAccountStatus";

const MARKET_ACCOUNT_STATUSES_COLLECTION_NAME = 'market_account_statuses';

export async function queryMarketAccountStatuses(db: Db, query: FilterQuery<MarketAccountStatus>): Promise<MarketAccountStatus[]> {
    try {
        const collection = db.collection(MARKET_ACCOUNT_STATUSES_COLLECTION_NAME);
        const cursor = collection.find<MarketAccountStatus>(query);

        return cursor.toArray();
    } catch (error) {
        console.error('[queryMarketAccountStatuses]', error);
        return [];
    }
}
