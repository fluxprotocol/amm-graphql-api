import { CapacitorLog } from "./CapacitorLog";

export interface Claim extends CapacitorLog {
    market_id: string;
    claimer: string;
    payout: string;
}
