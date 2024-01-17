// entrade-api.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { EntradeAPIService } from './entrade-api.service';

@Controller('entrade-api')
export class EntradeAPIController {
  constructor(private readonly entradeAPIService: EntradeAPIService) {}

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
      const moneyInfoPromises = Object.keys(tokens).map(async (accountType) => {
        try {
          const moneyInfo = await this.entradeAPIService.getMoneyInfo(accountType);
          return { accountType, moneyInfo };
        } catch (error) {
          return { accountType, error: error.message };
        }
      });

      const results = await Promise.all(moneyInfoPromises);
      return { moneyInfo: results };
    } catch (error) {
      return { error: error.message };
    }
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
}
