import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IncomeExpense } from '../model/income-expense';

@Injectable({
  providedIn: 'root'
})
export class IncomeExpensesHttpService {

  private readonly INCOME_EXPENSE_URL_PREFIX = '/api/v1/cashflows'

  constructor(private httpClient: HttpClient) { }

  getAllIncomeExpenses(cashflowId: string) {
    return this.httpClient.get<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial`);
  }
}