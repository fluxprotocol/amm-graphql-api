import { CapacitorLog } from "./CapacitorLog";

export interface Pool extends CapacitorLog {
    id: string;
    outcomes: number;
    collateral_token_id: string;
    collateral_denomination: string;
    owner: string;
    swap_fee: string;
    total_withdrawn_fees: string;
    block_height: string;
    fee_pool_weight: string;
}
