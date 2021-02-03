import Big from "big.js";

export function toTokenDenom(amount: string, decimals = 18): string {
    const denominator = new Big(10).pow(decimals);
    return new Big(amount).mul(denominator).toFixed(0);
}
