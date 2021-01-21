import { CapacitorLog } from "./CapacitorLog";

export interface Pool extends CapacitorLog {
    id: string;
    outcomes: number;
    collateral_token_id: string;
    seed_nonce: string;
    owner: string;
    public: boolean;
    swap_fee: string;
    total_withdrawn_fees: string;
    block_height: string;
    fee_pool_weight: string;
}
