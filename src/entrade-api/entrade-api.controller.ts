// entrade-api.controller.ts
import { Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('get-all-portfolio-info')
  async getAllPortfolioInfo() {
    return this.entradeAPIService.getAllPortfolioInfo();
  }

  @Get('get-all-money-info')
  async getAllMoneyInfo() {
    return this.entradeAPIService.getAllMoneyInfo();
  }

  @Get('get-all-deals-info')
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

  @Get('get-all-navs-info')
  async getNavAssetValueInfo(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.entradeAPIService.getAllAccountNavInfo(fromDate, toDate);
  }
  // You can add more endpoints as needed
}
