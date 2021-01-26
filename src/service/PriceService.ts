import Big from 'big.js';
import BN from 'bn.js';
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


export function getWeightForOutcome(outcome: number, balances: Balance[]): string {
    let oddsWeightForTarget: BN = new BN(0);

    balances.forEach((balanceItem) => {
        if (balanceItem.outcome_id !== outcome) {
            const balance = new BN(balanceItem.balance);

            if (oddsWeightForTarget.eq(new BN(0))) {
                oddsWeightForTarget = balance;
            } else {
                oddsWeightForTarget = oddsWeightForTarget.mul(balance);
            }
        }
    });

    return oddsWeightForTarget.toString();
}
