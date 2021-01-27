import { Balance } from "./Balance";

export interface PoolBalanceViewModel extends Balance {
    price: number;
    weight: string;
    odds: string;
}

export function transformToPoolBalanceViewModel(balance: Balance, price: number, weight: string, odds: string): PoolBalanceViewModel {
    return {
        ...balance,
        price,
        weight,
        odds,
    };
}
