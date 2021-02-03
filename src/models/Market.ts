import { Pool } from "./Pool";

export interface Market {
    id: string;
    description: string;
    extra_info: string;
    outcome_tags: string[];
    end_time: string;
    payout_numerator: string[];
    finalized: boolean;
    pool?: Pool;
    volume?: number;
    categories: string[];
}
