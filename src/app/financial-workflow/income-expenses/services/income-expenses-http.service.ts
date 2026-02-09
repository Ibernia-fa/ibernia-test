import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FinancialViewModel, IncomeExpense } from '../model/income-expense';

@Injectable({
  providedIn: 'root'
})
export class IncomeExpensesHttpService {

  private readonly INCOME_EXPENSE_URL_PREFIX = '/api/v1/cashflows'

  constructor(private httpClient: HttpClient) { }

  getAllIncomeExpenses(cashflowId: string) {
    return this.httpClient.get<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial`);
  }

  addIncome(cashflowId: string, income: FinancialViewModel) {
    return this.httpClient.post<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/income`, income)
  }
  
  addExpense(cashflowId: string, expense: FinancialViewModel) {
    return this.httpClient.post<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/expense`, expense)
  }
  
  updateIncome(cashflowId: string, income: FinancialViewModel) {
    return this.httpClient.put<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/income`, income)
  }
  
  updateExpense(cashflowId: string, expense: FinancialViewModel) {
    return this.httpClient.put<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/expense`, expense)
  }

  deleteIncome(cashflowId: string, income: FinancialViewModel) {
    return this.httpClient.delete<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/income`, {
      body: income
    })
  }
  
  deleteExpense(cashflowId: string, expense: FinancialViewModel) {
    return this.httpClient.delete<IncomeExpense>(`${this.INCOME_EXPENSE_URL_PREFIX}/${cashflowId}/financial/expense`, {
      body: expense
    })
  }
}