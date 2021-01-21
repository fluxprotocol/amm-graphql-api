import { gql } from 'apollo-server';

const typeDef = gql`
    type Market {
        id: Int
        description: String
        extra_info: String
        outcome_tags: [String]
        end_time: String
        pool: Pool
        payout_numerator: [String]
        finalized: Boolean
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
        getMarket(marketId: Int!): Market
        getMarkets(filters: MarketPaginationFilters): MarketPaginationResult
    }
`;

export default typeDef;
