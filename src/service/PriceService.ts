import Big from 'big.js';
import { Balance } from '../models/Balance';


/**
 * Computes the price of each outcome token given their holdings. Returns an array of numbers in the range [0, 1]
 *
 * @param poolBalances - the market maker's balances of outcome tokens
 * @author TokenUnion https://github.com/TokenUnion/amm-maths/blob/master/src/fpmm/price/calcPrice.ts
 */
export function calcPrice(poolBalances: string[]): number[] {
    const balances = poolBalances.map(h => new Big(h));

    const hasZeroBalances = balances.every(h => h.toString() === "0");
    if (hasZeroBalances) {
        return balances.map(() => 0);
    }

    const product = balances.reduce((a, b) => a.mul(b));
    const denominator = balances.map(h => product.div(h)).reduce((a, b) => a.add(b));
    const prices = balances.map(holding => product.div(holding).div(denominator));

    return prices.map(price => +price.valueOf());
};

interface OutcomeWeight {
    outcomeId: number;
    weight: Big;
}

export function getOddsWeights(balances: Balance[]): OutcomeWeight[] {
    return balances.map((outcomeBalance) => {
        const otherOutcomeBalances = balances.filter(balance => balance.outcome_id !== outcomeBalance.outcome_id);
        const oddsWeightForOutcome = otherOutcomeBalances.reduce((prev, current) => prev.mul(current.balance), new Big(1));

        return {
            outcomeId: outcomeBalance.outcome_id,
            weight: oddsWeightForOutcome,
        }
    });
}

export function getOddsForOutcome(outcome: number, weights: OutcomeWeight[]): Big {
    const oddsWeightForOutcome = weights.find(weight => weight.outcomeId === outcome);
    const sum = weights.reduce((prev, current) => prev.add(current.weight), new Big(0));

    if (!oddsWeightForOutcome) throw new Error('ERR_INVALID_OUTCOME');

    return oddsWeightForOutcome.weight.div(sum);
}
