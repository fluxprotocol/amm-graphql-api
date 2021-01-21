import { Pool } from "./Pool";
import { TokenStatus } from "./TokenStatus";

export interface TokenInfoViewModel extends TokenStatus {
    is_pool_token: boolean;
}

export function transformToTokenInfoViewModel(tokenStatus: TokenStatus, pool: Pool): TokenInfoViewModel {
    return {
        ...tokenStatus,
        is_pool_token: tokenStatus.outcome_id === pool.outcomes,
    };
}
