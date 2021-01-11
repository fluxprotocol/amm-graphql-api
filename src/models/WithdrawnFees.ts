import { CapacitorLog } from "./CapacitorLog";

export interface WithdrawnFees extends CapacitorLog {
    pool_id: string;
    outcome_id: number;
    account_id: string;
    withdrawn_amount: string;
    block_height: string;
}
