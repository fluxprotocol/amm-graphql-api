import Big from "big.js";

export function toTokenDenom(amount: string, decimals = 18): string {
    Big.DP = 0;
    const denominator = new Big(10).pow(decimals);
    return new Big(amount).mul(denominator).toString();
}
