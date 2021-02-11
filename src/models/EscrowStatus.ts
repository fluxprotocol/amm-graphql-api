export interface EscrowStatus {
    market_id: string;
    account_id: string;
    total_amount: string;
    type: 'invalid_escrow' | 'valid_escrow';
}
