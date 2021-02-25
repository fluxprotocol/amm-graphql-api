export interface MarketAccountStatus {
    id: string;
    cap_id: string;
    account_id: string;
    block_height: string;
    market_id: string;
    resolution_escrow: {
        valid: string;
        invalid: string;
    };
    spent: {
        outcome_id: number;
        spent: string;
    }[];
}
