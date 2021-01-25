import { Cursor, Db, FilterQuery } from "mongodb";
import { Swap } from '../models/Swap';

const SWAPS_COLLECTION_NAME = 'swaps';

export function getSwapCursorByMarketId(db: Db, marketId: string): Cursor<Swap> {
    const collection = db.collection(SWAPS_COLLECTION_NAME);
    const query: FilterQuery<Swap> = {
        pool_id: parseInt(marketId),
    };

    return collection.find<Swap>(query);
}
