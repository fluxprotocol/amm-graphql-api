import { Cursor, Db, FilterQuery } from "mongodb";
import { WithdrawnFees } from "../models/WithdrawnFees";

const WITHDRAWN_FEES_COLLECTION_NAME = 'withdrawn_fees';

async function filterDuplicateWithdrawnFees(cursor: Cursor<WithdrawnFees>) {
    const withdrawnFees: WithdrawnFees[] = [];
    const visitedIds: string[] = [];

    // Manual load to filter out duplicate data
    while (await cursor.hasNext()) {
        const withdrawnFee = await cursor.next();
        if (!withdrawnFee) continue;
        const id = `${withdrawnFee.pool_id}_${withdrawnFee.outcome_id}_${withdrawnFee.account_id}`;

        if (visitedIds.includes(id)) {
            continue;
        }

        withdrawnFees.push(withdrawnFee);
        visitedIds.push(id);
    }

    return withdrawnFees;
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
