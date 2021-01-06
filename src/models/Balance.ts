import { CapacitorLog } from "./CapacitorLog";

export interface Balance extends CapacitorLog {
    id: string;
    pool_id: string;
    outcome_id: number;
    account_id: string;
    balance: string;
    block_height: string;
}
