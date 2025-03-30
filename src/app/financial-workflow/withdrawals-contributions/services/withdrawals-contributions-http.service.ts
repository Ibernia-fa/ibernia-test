import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FundsViewModel, WithdrawalsContributions } from '../model/withdrawals-contributions';

@Injectable({
  providedIn: 'root'
})
export class WithdrawalsContributionsHttpService {

  private readonly WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX = '/api/v1/cashflows'

  constructor(private httpClient: HttpClient) { }

  getAllWithdrawalsContributions(cashflowId: string) {
    return this.httpClient.get<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds`);
  }

  addWithdrawals(cashflowId: string, withdrawals: FundsViewModel) {
    return this.httpClient.post<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/withdrawals`, withdrawals)
  }
  
  addContributions(cashflowId: string, contributions: FundsViewModel) {
    return this.httpClient.post<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/contributions`, contributions)
  }
  
  updateWithdrawals(cashflowId: string, withdrawals: FundsViewModel) {
    return this.httpClient.put<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/withdrawals`, withdrawals)
  }
  
  updateContributions(cashflowId: string, contributions: FundsViewModel) {
    return this.httpClient.put<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/contributions`, contributions)
  }

  deleteWithdrawals(cashflowId: string, withdrawals: FundsViewModel) {
    return this.httpClient.delete<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/withdrawals`, {
      body: withdrawals
    })
  }
  
  deleteContributions(cashflowId: string, contributions: FundsViewModel) {
    return this.httpClient.delete<WithdrawalsContributions>(`${this.WITHDRAWALS_CONTRIBUTIONS_URL_PREFIX}/${cashflowId}/funds/contributions`, {
      body: contributions
    })
  }
}