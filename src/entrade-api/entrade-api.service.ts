// entrade-api.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class EntradeAPIService {
    private readonly BASE_URL = 'https://services.entrade.com.vn';
    private readonly LOGIN_URL = `${this.BASE_URL}/dnse-user-service/api/auth`;
    private readonly USER_INFO_URL = `${this.BASE_URL}/dnse-user-service/api/me`;

    private session: AxiosInstance;
    private tokens: { [key: string]: string } = {};
    private accountsTokens: Record<string, string> = {};

    constructor() {
        this.session = axios.create();
    }

    async initializeAccountsIfNeeded(): Promise<Record<string, string>> {
        if (Object.keys(this.tokens).length === 0) {
            console.log('Initializing tokens...');
            this.tokens = await this.initializeAccounts();
            console.log('Tokens initialized successfully.');
        }

        return this.tokens;
    }

    getToken(accountType: string): string | undefined {
        return this.tokens[accountType];
    }

    async initializeAccounts(): Promise<Record<string, string>> {
        const accountTypes = ['momentum', 'quality', 'value'];

        const loginPromises = accountTypes.map(async (accountType) => {
            const usernameEnvVar = `${accountType.toUpperCase()}_USERNAME`;
            const passwordEnvVar = `${accountType.toUpperCase()}_PASSWORD`;

            const username = process.env[usernameEnvVar] ?? '';
            const password = process.env[passwordEnvVar] ?? '';

            try {
                const token = await this.login(username, password);
                this.tokens[accountType] = token;
                return { accountType, token };
            } catch (error) {
                console.error(`Error logging in to ${accountType} account: ${error.message}`);
                return { accountType, error: error.message };
            }
        });

        const results = await Promise.all(loginPromises);

        results.forEach(({ accountType, token, error }) => {
            if (token) {
                this.tokens[accountType] = token;
            } else {
                console.error(`Error logging in to ${accountType} account: ${error}`);
            }
        });

        return this.tokens;
    }

    private async login(username: string, password: string): Promise<string> {
        const loginPayload = { username, password };

        try {
            const loginRequest = await this.session.post(this.LOGIN_URL, loginPayload);

            if (loginRequest.status === 200) {
                const usrJson = loginRequest.data;
                const token = `Bearer ${usrJson.token}`;
                return token;
            } else {
                throw new Error(`Login failed with status code: ${loginRequest.status}`);
            }
        } catch (error) {
            throw new Error(`Error during login: ${error.message}`);
        }
    }

    async getUserInfoAndSubAccounts(accountType: string): Promise<{ allInfo: any, subAccounts: any[] }> {
        const token = this.tokens[accountType];
        if (!token) {
            throw new Error(`Token not found for ${accountType} account. Please log in first.`);
        }

        // Get user info
        const userInfoResponse = await this.session.get(this.USER_INFO_URL, { headers: { Authorization: token } });
        if (userInfoResponse.status !== 200) {
            throw new Error(`Failed to get user info with status code: ${userInfoResponse.status}`);
        }

        const allInfo = userInfoResponse.data;

        // Get sub-accounts
        const subAccountsUrl = `${this.BASE_URL}/dnse-order-service/accounts?custodyCode=${allInfo.custodyCode}`;
        const subAccountsResponse = await this.session.get(subAccountsUrl, { headers: { Authorization: token } });

        if (subAccountsResponse.status !== 200) {
            throw new Error(`Failed to get sub accounts with status code: ${subAccountsResponse.status}`);
        }

        const subAccounts = subAccountsResponse.data.accounts;

        if (subAccounts.length === 0) {
            throw new Error(`No sub-accounts found for ${accountType} account.`);
        }

        return { allInfo, subAccounts };
    }

    // Get portfolio info for all accounts
    async getAllPortfolioInfo() {
        try {
            const tokens = await this.initializeAccountsIfNeeded();
            const portfolioInfoPromises = Object.keys(tokens).map(async (accountType) => {
                try {
                    const portfolioInfo = await this.getPortfolioInfo(accountType);
                    return { accountType, portfolioInfo };
                } catch (error) {
                    return { accountType, error: error.message };
                }
            });
    
            const portfolioInfoResults = await Promise.all(portfolioInfoPromises);
            const totalStocks = portfolioInfoResults.flatMap((entry) => entry.portfolioInfo.stocks);
    
            const totalPortfolioInfo = {
                accountType: 'total',
                portfolioInfo: {
                    investorId: 'totalPortInvestorId',
                    custodyCode: 'totalPortCustodyCode',
                    investorAccountId: 'totalPortInvestorAccountId',
                    stocks: totalStocks.map((stock) => ({ ...stock })),
                    id: 'totalPortId',
                },
            };
    
            const results = portfolioInfoResults.map((portfolioEntry) => ({
                accountType: portfolioEntry.accountType,
                portfolioInfo: {
                    investorId: portfolioEntry.portfolioInfo.investorId,
                    custodyCode: portfolioEntry.portfolioInfo.custodyCode,
                    investorAccountId: portfolioEntry.portfolioInfo.investorAccountId,
                    stocks: portfolioEntry.portfolioInfo.stocks.map((stock) => ({ ...stock })),
                    id: portfolioEntry.portfolioInfo.id,
                },
            }));
    
            results.unshift(totalPortfolioInfo);
    
            return { portfolioInfo: results };
        } catch (error) {
            return { error: error.message };
        }
    }
    // Get portfolio info for a single account
    async getPortfolioInfo(accountType: string): Promise<any> {
        try {
            const { allInfo, subAccounts } = await this.getUserInfoAndSubAccounts(accountType);

            // Ensure account ID is available
            const accountId = subAccounts[0].id;

            // Get portfolio info
            const portInfoUrl = `${this.BASE_URL}/dnse-order-service/portfolios/${accountId}`;
            const portInfoResponse = await this.session.get(portInfoUrl, { headers: { Authorization: this.tokens[accountType] } });

            if (portInfoResponse.status !== 200) {
                throw new Error(`Failed to get portfolio info with status code: ${portInfoResponse.status}`);
            }

            return portInfoResponse.data;
        } catch (error) {
            throw new Error(`Error getting sub-accounts and portfolio info for ${accountType} account: ${error.message}`);
        }
    }

    async getCurrentDealsInfo(accountType: string): Promise<any> {
        try {
            const { allInfo, subAccounts } = await this.getUserInfoAndSubAccounts(accountType);

            // Ensure account ID is available
            const accountId = subAccounts[0].id;

            // Get current deals
            const currentDealsUrl = `${this.BASE_URL}/dnse-deal-service/deals?accountNo=${accountId}`;
            const currentDealsResponse = await this.session.get(currentDealsUrl, { headers: { Authorization: this.tokens[accountType] } });

            if (currentDealsResponse.status !== 200) {
                throw new Error(`Failed to get current deals with status code: ${currentDealsResponse.status}`);
            }

            return currentDealsResponse.data;
        } catch (error) {
            throw new Error(`Error getting current deals for ${accountType} account: ${error.message}`);
        }
    }

    // Get money info for all accounts
    async getAllMoneyInfo() {
        try {
            const tokens = await this.initializeAccountsIfNeeded();

            const moneyInfoPromises = Object.keys(tokens).map(async (accountType) => {
                try {
                    const moneyInfo = await this.getSingleAccountMoneyInfo(accountType);
                    return { accountType, moneyInfo };
                } catch (error) {
                    return { accountType, error: error.message };
                }
            });

            const moneyInfoResults = await Promise.all(moneyInfoPromises);
            const totalMoneyInfo: any = {};
            totalMoneyInfo.investorId = 'totalPortInvestorId';
            totalMoneyInfo.custodyCode = 'totalPortCustodyCode';
            totalMoneyInfo.investorAccountId = 'totalPortInvestorAccountId';

            moneyInfoResults.forEach((moneyInfo) => {
                for (const prop in moneyInfo.moneyInfo) {
                    if (
                        moneyInfo.moneyInfo.hasOwnProperty(prop) &&
                        typeof moneyInfo.moneyInfo[prop] === 'number' &&
                        prop !== 'accountType'
                    ) {
                        totalMoneyInfo[prop] = (totalMoneyInfo[prop] || 0) + moneyInfo.moneyInfo[prop];
                    }
                }
            });

            const formattedTotalMoneyInfo = [
                {
                    accountType: 'total',
                    moneyInfo: totalMoneyInfo,
                },
                ...moneyInfoResults.map((entry) => ({ accountType: entry.accountType, moneyInfo: entry.moneyInfo })),
            ];

            const result = {
                moneyInfo: formattedTotalMoneyInfo,
            };

            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    // Get money for a single account
    async getSingleAccountMoneyInfo(accountType: string): Promise<any> {
        try {
            const { subAccounts } = await this.getUserInfoAndSubAccounts(accountType);

            const accountId = subAccounts[0].id;
            const moneyInfoUrl = `${this.BASE_URL}/dnse-order-service/account-balances/${accountId}`;
            const moneyInfoResponse = await this.session.get(moneyInfoUrl, { headers: { Authorization: this.tokens[accountType] } });

            if (moneyInfoResponse.status !== 200) {
                throw new Error(`Failed to get money info with status code: ${moneyInfoResponse.status}`);
            }

            return moneyInfoResponse.data;
        } catch (error) {
            throw new Error(`Error getting money info for ${accountType} account: ${error.message}`);
        }
    }

    async getAllAccountNavInfo() {
        try {
            const tokens = await this.initializeAccountsIfNeeded();
            const navsInfoPromises = Object.keys(tokens).map(async (accountType) => {
                try {
                    const navInfo = await this.getSingleAccountNavInfo(accountType);
                    return { accountType, navInfo };
                } catch (error) {
                    return { accountType, error: error.message };
                }
            });
    
            let navInfoResults = await Promise.all(navsInfoPromises);
    
            // Combine data from different account types for the same date into total
            const totalData: { [date: string]: any[] } = {};
            navInfoResults.forEach((result) => {
                const navInfo = result.navInfo;
                const dates = Object.keys(navInfo.data);
                dates.forEach((date) => {
                    if (!totalData[date]) {
                        totalData[date] = [];
                    }
                    totalData[date] = totalData[date].concat(navInfo.data[date]);
                });
            });
    
            // Aggregate data for total account type
            const totalAccountData: { [accountNo: string]: any[] } = {};
            Object.values(totalData).forEach((entries) => {
                entries.forEach((entry) => {
                    const accountNo = "totalPort";
                    if (!totalAccountData[accountNo]) {
                        totalAccountData[accountNo] = [];
                    }
                    const existingEntry = totalAccountData[accountNo].find((e) => e.time === entry.time);
                    if (existingEntry) {
                        existingEntry.totalCash += entry.totalCash;
                        existingEntry.netAssetValue += entry.netAssetValue;
                        existingEntry.stockValue += entry.stockValue;
                        existingEntry.totalDebt += entry.totalDebt;
                    } else {
                        totalAccountData[accountNo].push({ ...entry, accountNo });
                    }
                });
            });
    
            // Add total data to navInfoResults
            navInfoResults.push({ accountType: "total", navInfo: { data: totalAccountData } });
    
            console.log("Nav Info Results:", navInfoResults);
            return navInfoResults;
        } catch (error) {
            console.error("Error:", error.message);
            return { error: error.message };
        }
    }
    // Get net asset value for a single account
    async getSingleAccountNavInfo(accountType: string): Promise<any>{
        try {
            const { subAccounts } = await this.getUserInfoAndSubAccounts(accountType);

            const accountId = subAccounts[0].id;
            // https://services.entrade.com.vn/dnse-asset-service/customer-asset-history?investorAccountIds=0001209371&fromDate=20-01-2024&toDate=20-02-2024
            const navInfoUrl = `${this.BASE_URL}/dnse-asset-service/customer-asset-history?investorAccountIds=${accountId}&fromDate=20-01-2024&toDate=20-02-2024`;
            const navInfoUrlResponse = await this.session.get(navInfoUrl, { headers: { Authorization: this.tokens[accountType] } });

            if (navInfoUrlResponse.status !== 200) {
                throw new Error(`Failed to get money info with status code: ${navInfoUrlResponse.status}`);
            }

            return navInfoUrlResponse.data;
        } catch (error) {
            throw new Error(`Error getting nav info for ${accountType} account: ${error.message}`);
        }
    }
}
