import { Balance } from "./Balance";

export interface PoolBalanceViewModel extends Balance {
    price: number;
}

export function transformToPoolBalanceViewModel(balance: Balance, price: number): PoolBalanceViewModel {
    return {
        ...balance,
        price,
    };
}
