import { Cursor, Db, FilterQuery } from "mongodb";
import { Balance } from "../models/Balance";
import { PROTOCOL_ACCOUNT } from '../constants';
import { calcPrice } from "./PriceService";
import BN from "bn.js";
import { PoolBalanceViewModel, transformToPoolBalanceViewModel } from "../models/PoolBalanceViewModel";

const USER_BALANCES_COLLECTION_NAME = 'user_balances';

async function filterDuplicateBalances(cursor: Cursor<Balance>) {
    const balances: Balance[] = [];
    const visitedIds: string[] = [];

    // Manual load to filter out duplicate data
    while (await cursor.hasNext()) {
        const balance = await cursor.next();
        if (!balance) continue;

        if (visitedIds.includes(balance.id)) {
            continue;
        }

        balances.push(balance);
        visitedIds.push(balance.id);
    }

    return balances;
}

export async function getBalancesByAccountId(db: Db, accountId: string): Promise<Balance[]> {
    try {
        const collection = db.collection(USER_BALANCES_COLLECTION_NAME);
        const query: FilterQuery<Balance> = {
            account_id: accountId,
        };

        const cursor = collection.find<Balance>(query).sort({ cap_creation_date: -1 });
        return filterDuplicateBalances(cursor);
    } catch (error) {
        console.error('[getBalancesByAccountId]', error);
        return [];
    }
}

export async function getBalancesForPoolId(db: Db, poolId: string): Promise<PoolBalanceViewModel[]> {
    try {
        const collection = db.collection(USER_BALANCES_COLLECTION_NAME);
        const query: FilterQuery<Balance> = {
            account_id: PROTOCOL_ACCOUNT,
            pool_id: poolId,
        };

        const cursor = collection.find<Balance>(query).sort({ cap_creation_date: -1 });
        const balances = await filterDuplicateBalances(cursor);
        const prices = calcPrice(balances.map(b => b.balance));

        return balances.map((balance, index) => transformToPoolBalanceViewModel(balance, prices[index]));
    } catch (error) {
        console.error('[getBalancesForPoolId]', error);
        return [];
    }
}
