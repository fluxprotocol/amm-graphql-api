import { Cursor, Db, FilterQuery } from "mongodb";
import Big from "big.js";

import { Balance } from "../models/Balance";
import { PROTOCOL_ACCOUNT } from '../constants';
import { calcPrice, getOddsForOutcome, getOddsWeights } from "./PriceService";
import { getTokensInfoByCondition } from './TokenStatusesService';
import { PoolBalanceViewModel, transformToPoolBalanceViewModel } from "../models/PoolBalanceViewModel";
import { getPoolsByIds, getPoolTokensForAccountId } from "./PoolService";
import { TokenStatus } from "../models/TokenStatus";
import { PoolTokensFeesEarnedViewModel } from "../models/PoolTokenFeesEarnedViewModel";
import { getWithdrawnFeesByCondition } from "./WithdrawnFeesService";

const USER_BALANCES_COLLECTION_NAME = 'user_balances';

async function filterDuplicateBalances(cursor: Cursor<Balance>): Promise<Balance[]> {
    const balances: Map<string, Balance> = new Map();

    // Manual load to filter out duplicate data
    while (await cursor.hasNext()) {
        const balance = await cursor.next();
        if (!balance) continue;

        if (balances.has(balance.id)) {
            const visitedBalance = balances.get(balance.id);

            // Its possible that two actions have been performed on the exact same time
            // The last item is considerd the newest
            if (balance.cap_creation_date.getTime() === visitedBalance?.cap_creation_date.getTime()) {
                balances.set(balance.id, balance);
            }

            continue;
        }

        balances.set(balance.id, balance);
    }

    return Array.from(balances.values());
}

export async function queryBalances(db: Db, query: FilterQuery<Balance>, filterDuplicates = true): Promise<Balance[]> {
    try {
        const collection = db.collection(USER_BALANCES_COLLECTION_NAME);
        const cursor = collection.find<Balance>(query).sort({ cap_creation_date: -1 });

        if (filterDuplicates) {
            return filterDuplicateBalances(cursor);
        }

        return cursor.toArray();
    } catch (error) {
        console.error('[queryBalances]', error);
        return [];
    }
}

export async function getBalancesByAccountId(db: Db, accountId: string, poolId?: string): Promise<Balance[]> {
    try {
        const query: FilterQuery<Balance> = {
            account_id: accountId,
        }

        if (poolId) {
            query.pool_id = poolId;
        }

        return queryBalances(db, query);
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
        const weights = getOddsWeights(balances);

        return balances.map((balance, index) => transformToPoolBalanceViewModel(
            balance,
            prices[index],
            weights.find(weight => weight.outcomeId === balance.outcome_id)?.weight.toString() || "0",
            getOddsForOutcome(balance.outcome_id, weights).toString(),
        ));
    } catch (error) {
        console.error('[getBalancesForPoolId]', error);
        return [];
    }
}

export async function getWithdrawableFees(db: Db, accountId: string, poolId?: string): Promise<PoolTokensFeesEarnedViewModel[]> {
    try {
        const poolTokens = await getPoolTokensForAccountId(db, accountId, poolId);

        if (!poolTokens.length) {
            return [];
        }

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

            // Avoid div by 0 errors
            if (tokenStatus.total_supply === '0') {
                return {
                    poolId: poolToken.pool_id,
                    outcomeId: poolToken.outcome_id,
                    fees: '0',
                    balance: poolToken.balance,
                };
            }

            let feesEarned = (new Big(pool.fee_pool_weight).mul(poolToken.balance)).div(tokenStatus.total_supply);

            if (withdrawnFee) {
                feesEarned = feesEarned.sub(withdrawnFee.withdrawn_amount);
            }

            return {
                poolId: poolToken.pool_id,
                outcomeId: poolToken.outcome_id,
                fees: feesEarned.toString(),
                balance: poolToken.balance,
            };
        });
    } catch (error) {
        console.error('[getWithdrawableFees]', error);
        return [];
    }
}
