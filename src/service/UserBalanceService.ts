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
import { getClaimedEarningsByAccount } from "./ClaimService";
import { queryAccountSpent } from "./AccountSpentService";
import { AccountSpent } from "../models/AccountSpent";

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
            if (new Date(Number(balance.creation_date)).getTime() === new Date(Number(visitedBalance?.creation_date ?? 0)).getTime()) {
                balances.set(balance.id, balance);
            }

            continue;
        }

        balances.set(balance.id, balance);
    }

    return Array.from(balances.values());
}

interface QueryBalancesOptions {
    filterDuplicates?: boolean;
    addSpent?: boolean;
}

export async function queryBalances(db: Db, query: FilterQuery<Balance>, queryOptions: QueryBalancesOptions = {}): Promise<Balance[]> {
    try {
        const options: QueryBalancesOptions = {
            filterDuplicates: true,
            addSpent: false,
            ...queryOptions,
        };

        const collection = db.collection(USER_BALANCES_COLLECTION_NAME);
        const cursor = collection.find<Balance>(query).sort({ creation_date: -1 });
        let balances: Balance[] = [];

        if (options.filterDuplicates) {
            balances = await filterDuplicateBalances(cursor);
        } else {
            balances = await cursor.toArray();
        }

        // Combines the market account statuses with the balances
        if (options.addSpent) {
            const accountStatusQuery: FilterQuery<AccountSpent> = {
                account_id: query.account_id,
            };

            if (query.pool_id) accountStatusQuery.market_id = query.pool_id;
            const accountsStatuses = await queryAccountSpent(db, accountStatusQuery);

            // Convert to map first in order to make lookups faster
            const mappedAccountsStatuses = new Map<string, AccountSpent>(accountsStatuses.map(s => [`${s.account_id}_${s.market_id}_${s.outcome_id}`, s]));

            balances = balances.map((balance) => {
                const accountStatus = mappedAccountsStatuses.get(`${balance.account_id}_${balance.pool_id}_${balance.outcome_id}`);

                return {
                    ...balance,
                    spent: accountStatus?.spent ?? '0',
                }
            });
        }

        return balances;
    } catch (error) {
        console.error('[queryBalances]', error);
        return [];
    }
}

export interface AccountBalancesOptions {
    removeZeroBalances?: boolean;
    removeClaimedBalances?: boolean;
}

export async function getBalancesByAccountId(db: Db, accountId: string, poolId?: string, options: AccountBalancesOptions = {}): Promise<Balance[]> {
    try {
        const query: FilterQuery<Balance> = {
            account_id: accountId,
        }

        if (poolId) {
            query.pool_id = poolId;
        }

        let balances = await queryBalances(db, query, {
            addSpent: true,
        });

        if (options.removeZeroBalances) {
            balances = balances.filter(b => b.balance !== '0');
        }

        if (options.removeClaimedBalances) {
            const claims = await getClaimedEarningsByAccount(db, accountId);
            const claimsMarketIds = claims.map(claim => claim.market_id);
            balances = balances.filter(b => !claimsMarketIds.includes(b.pool_id));
        }

        return balances;
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

        const cursor = collection.find<Balance>(query).sort({ creation_date: -1 });
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

export interface WithdrawableFeesOptions {
    removeZeroBalances?: boolean;
    removeClaimedBalances?: boolean;
}

export async function getWithdrawableFees(db: Db, accountId: string, poolId?: string, options: WithdrawableFeesOptions = {}): Promise<PoolTokensFeesEarnedViewModel[]> {
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

        let balances: PoolTokensFeesEarnedViewModel[] = poolTokens.map((poolToken) => {
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

        if (options.removeZeroBalances) {
            balances = balances.filter(b => b.balance !== '0');
        }

        if (options.removeClaimedBalances) {
            const claims = await getClaimedEarningsByAccount(db, accountId);
            const claimsMarketIds = claims.map(claim => claim.market_id);
            balances = balances.filter(b => !claimsMarketIds.includes(b.poolId));
        }

        return balances;
    } catch (error) {
        console.error('[getWithdrawableFees]', error);
        return [];
    }
}
