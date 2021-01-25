import { gql } from 'apollo-server';

const typeDef = gql`
    type Account {
        account_id: String

        balances(marketId: String): [Balance]

        earned_fees: [PoolTokenFeesEarned]
    }

    extend type Query {
        getAccount(accountId: String!): Account
    }
`;

export default typeDef;
