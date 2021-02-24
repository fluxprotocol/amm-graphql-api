import { gql } from 'apollo-server';

const typeDef = gql`
    type Account {
        account_id: String

        balances(poolId: String, removeClaimedBalances: Boolean, removeZeroBalances: Boolean): [Balance]

        earned_fees(poolId: String, removeClaimedBalances: Boolean, removeZeroBalances: Boolean): [PoolTokenFeesEarned]
    }

    extend type Query {
        getAccount(accountId: String!): Account
    }
`;

export default typeDef;
