import { gql } from 'apollo-server';

const typeDef = gql`
    type EscrowStatus {
        market_id: String
        account_id: String
        total_amount: String
        type: String
    }

    extend type Query {
        getEscrowStatus(marketId: String!, accountId: String!): [EscrowStatus]
    }
`;

export default typeDef;
