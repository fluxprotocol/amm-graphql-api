import { gql } from 'apollo-server';

const typeDef = gql`
    type Account {
        account_id: String

        balances(poolId: String): [Balance]

        earned_fees(poolId: String): [PoolTokenFeesEarned]
    }

    extend type Query {
        getAccount(accountId: String!): Account
    }
`;

export default typeDef;
