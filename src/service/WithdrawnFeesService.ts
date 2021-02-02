import { Cursor, Db, FilterQuery } from "mongodb";
import { WithdrawnFees } from "../models/WithdrawnFees";

const WITHDRAWN_FEES_COLLECTION_NAME = 'withdrawn_fees';

async function filterDuplicateWithdrawnFees(cursor: Cursor<WithdrawnFees>): Promise<WithdrawnFees[]> {
    const withdrawnFees: Map<string, WithdrawnFees> = new Map();

    // Manual load to filter out duplicate data
    while (await cursor.hasNext()) {
        const withdrawnFee = await cursor.next();
        if (!withdrawnFee) continue;
        const id = `${withdrawnFee.pool_id}_${withdrawnFee.outcome_id}_${withdrawnFee.account_id}`;

        if (withdrawnFees.has(id)) {
            const visitedWithdrawnFee = withdrawnFees.get(id);

            // Its possible that two actions have been performed on the exact same time
            // The last item is considerd the newest
            if (withdrawnFee.cap_creation_date.getTime() === visitedWithdrawnFee?.cap_creation_date.getTime()) {
                withdrawnFees.set(id, withdrawnFee);
            }

            continue;
        }

        withdrawnFees.set(id, withdrawnFee);
    }

    return Array.from(withdrawnFees.values());
}


export async function getWithdrawnFeesByCondition(db: Db, conditions: Partial<WithdrawnFees>[]): Promise<WithdrawnFees[]> {
    try {
        const collection = db.collection<WithdrawnFees>(WITHDRAWN_FEES_COLLECTION_NAME);
        const query: FilterQuery<WithdrawnFees> = {
            $or: conditions,
        };

        const cursor = collection.find<WithdrawnFees>(query).sort({ cap_creation_date: -1 });
        return filterDuplicateWithdrawnFees(cursor);
    } catch (error) {
        console.error('[getWithdrawnFeesByCondition]', error);
        return [];
    }
}
