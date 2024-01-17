// entrade-api.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { EntradeAPIService } from './entrade-api.service';

@Controller('entrade-api')
export class EntradeAPIController {
  constructor(private readonly entradeAPIService: EntradeAPIService) { }

  @Get('initialize-accounts')
  async initializeAccounts() {
    try {
      const result = await this.entradeAPIService.initializeAccounts();
      return { tokens: result };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('get-all-accounts-portfolio-info')
  async getAllPortfolioInfo() {
    try {
      const tokens = await this.entradeAPIService.initializeAccountsIfNeeded();
      const portfolioInfoPromises = Object.keys(tokens).map(async (accountType) => {
        try {
          const portfolioInfo = await this.entradeAPIService.getPortfolioInfo(accountType);
          return { accountType, portfolioInfo };
        } catch (error) {
          return { accountType, error: error.message };
        }
      });

      const results = await Promise.all(portfolioInfoPromises);
      return { portfolioInfo: results };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('get-all-accounts-money-info')
  async getAllMoneyInfo() {
    try {
      const tokens = await this.entradeAPIService.initializeAccountsIfNeeded();
  
      // Fetch money info for all account types
      const moneyInfoPromises = Object.keys(tokens).map(async (accountType) => {
        try {
          const moneyInfo = await this.entradeAPIService.getMoneyInfo(accountType);
          return { accountType, moneyInfo };
        } catch (error) {
          return { accountType, error: error.message };
        }
      });
  
      // Wait for all moneyInfoPromises to resolve
      const moneyInfoResults = await Promise.all(moneyInfoPromises);
  
      // Use the combined money info to calculate totalMoneyInfo dynamically
      const totalMoneyInfo = this.calculateTotalMoneyInfoDynamically(moneyInfoResults);
  
      const formattedTotalMoneyInfo = [
        {
          accountType: 'total',
          moneyInfo: totalMoneyInfo,
        },
        ...moneyInfoResults.map((entry) => ({ accountType: entry.accountType, moneyInfo: entry.moneyInfo })),
      ];
  
      // Combine all data and return the result
      const result = {
        moneyInfo: formattedTotalMoneyInfo,
      };
  
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  // Example function to calculate totalMoneyInfo dynamically from all moneyInfo results
  calculateTotalMoneyInfoDynamically(moneyInfoResults: any[]) {
    const totalMoneyInfo: any = {};
    // Include synthetic values for investorId, custodyCode, and investorAccountId in totalMoneyInfo
    totalMoneyInfo.investorId = 'totalPortInvestorId';
    totalMoneyInfo.custodyCode = 'totalPortCustodyCode';
    totalMoneyInfo.investorAccountId = 'totalPortInvestorAccountId';

    moneyInfoResults.forEach((moneyInfo) => {
      for (const prop in moneyInfo.moneyInfo) {
        if (
          moneyInfo.moneyInfo.hasOwnProperty(prop) &&
          typeof moneyInfo.moneyInfo[prop] === 'number' &&
          prop !== 'accountType' // Exclude accountType from the dynamic calculation
        ) {
          totalMoneyInfo[prop] = (totalMoneyInfo[prop] || 0) + moneyInfo.moneyInfo[prop];
        }
      }
    });

    return totalMoneyInfo;
  }

  @Get('get-all-accounts-current-deals-info')
  async getAllCurrentDealsInfo() {
    try {
      const tokens = await this.entradeAPIService.initializeAccountsIfNeeded();
      const currentDealsInfoPromises = Object.keys(tokens).map(async (accountType) => {
        try {
          const currentDealsInfo = await this.entradeAPIService.getCurrentDealsInfo(accountType);
          return { accountType, currentDealsInfo };
        } catch (error) {
          return { accountType, error: error.message };
        }
      });

      const results = await Promise.all(currentDealsInfoPromises);
      return { currentDealsInfo: results };
    } catch (error) {
      return { error: error.message };
    }
  }
  // You can add more endpoints as needed
}
