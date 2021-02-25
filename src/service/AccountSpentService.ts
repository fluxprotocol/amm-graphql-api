import { Db, FilterQuery } from "mongodb";
import { AccountSpent } from "../models/AccountSpent";

const ACCOUNT_SPENT_COLLECTION_NAME = 'account_spent';

export async function queryAccountSpent(db: Db, query: FilterQuery<AccountSpent>): Promise<AccountSpent[]> {
    try {
        const collection = db.collection(ACCOUNT_SPENT_COLLECTION_NAME);
        const cursor = collection.find<AccountSpent>(query);

        return cursor.toArray();
    } catch (error) {
        console.error('[queryAccountSpent]', error);
        return [];
    }
}
