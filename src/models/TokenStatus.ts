import { CapacitorLog } from "./CapacitorLog";

export interface TokenStatus extends CapacitorLog {
    id: string;
    pool_id: string;
    outcome_id: string;
    total_supply: string;
    block_height: string;
}
