import { gql } from 'apollo-server';

const typeDef = gql`
    type Market {
        id: String
        description: String
        extra_info: String
        outcome_tags: [String]
        end_time: String
        pool: Pool
        payout_numerator: [String]
        finalized: Boolean
        categories: [String]
        creation_date: String

        volume: String
        claimed_earnings(accountId: String): Claim
        escrow_status(accountId: String): [EscrowStatus]
    }

    input MarketPaginationFilters {
        limit: Int
        offset: Int
        categories: [String]
        expired: Boolean
        finalized: Boolean
    }

    type MarketPaginationResult {
        items: [Market]
        total: Int
    }

    extend type Query {
        getMarket(marketId: String!): Market
        getMarkets(filters: MarketPaginationFilters): MarketPaginationResult
    }
`;

export default typeDef;
