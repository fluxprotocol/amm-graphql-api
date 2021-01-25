import { CapacitorLog } from "./CapacitorLog";

export interface Swap extends CapacitorLog {
    pool_id: string;
    account_id: string;
    outcome_id: number;
    input: string;
    output: string;
    fee: string;
    type: 'buy' | 'sell';
}
