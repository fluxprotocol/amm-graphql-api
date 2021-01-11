import { Cursor, Db, FilterQuery } from "mongodb";
import { Balance } from "../models/Balance";
import { PROTOCOL_ACCOUNT } from '../constants';
import { calcPrice, getWeightForOutcome } from "./PriceService";
import { getTokensInfoByCondition } from './TokenStatusesService';
import { PoolBalanceViewModel, transformToPoolBalanceViewModel } from "../models/PoolBalanceViewModel";
import { Pool } from "../models/Pool";
import { getPoolById, getPoolsByIds, getPoolTokensForAccountId } from "./PoolService";
import { TokenStatus } from "../models/TokenStatus";
import { PoolTokensFeesEarnedViewModel } from "../models/PoolTokenFeesEarnedViewModel";
import Big from "big.js";
import { getWithdrawnFeesByCondition } from "./WithdrawnFeesService";

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

        return balances.map((balance, index) => transformToPoolBalanceViewModel(
            balance,
            prices[index],
            getWeightForOutcome(balance.outcome_id, balances)
        ));
    } catch (error) {
        console.error('[getBalancesForPoolId]', error);
        return [];
    }
}

export async function getWithdrawableFees(db: Db, accountId: string): Promise<PoolTokensFeesEarnedViewModel[]> {
    try {
        const poolTokens = await getPoolTokensForAccountId(db, accountId);
        const tokenStatusQuery: Partial<TokenStatus>[] = poolTokens.map(token => ({
            outcome_id: token.outcome_id,
            pool_id: token.pool_id,
        }));

        const withdrawnFees = await getWithdrawnFeesByCondition(db, poolTokens.map(token => ({
            outcome_id: token.outcome_id,
            account_id: token.account_id,
            pool_id: token.pool_id,
        })));

        const pools = await getPoolsByIds(db, poolTokens.map(token => token.pool_id));
        const tokenStatuses = await getTokensInfoByCondition(db, tokenStatusQuery);
        return poolTokens.map((poolToken) => {
            const pool = pools.find(pool => pool.id === poolToken.pool_id);
            const tokenStatus = tokenStatuses.find(status => status.pool_id === poolToken.pool_id);
            const withdrawnFee = withdrawnFees.find(fee => fee.pool_id === poolToken.pool_id);

            if (!pool || !tokenStatus) {
                throw new Error('Corrupted data');
            }


            let feesEarned = (new Big(pool.fee_pool_weight).mul(poolToken.balance)).div(tokenStatus.total_supply);

            if (withdrawnFee) {
                feesEarned = feesEarned.sub(withdrawnFee.withdrawn_amount);
            }

            return {
                poolId: poolToken.pool_id,
                outcomeId: poolToken.outcome_id,
                fees: feesEarned.toString(),
            };
        });
    } catch (error) {
        console.error('[getWithdrawableFees]', error);
        return [];
    }
}
