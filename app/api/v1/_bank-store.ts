export type Customer = { id: string; firstName: string; middleName: string; lastName: string; suffix: string; shortName: string; maidenName: string; dateOfBirth: string; isMinorCustomer: boolean; gender: string; birthCountry: string; nationality: string; status: "active" | "inactive"; createdAt: string };
export type CustomerInput = Omit<Customer, "id" | "status" | "createdAt">;
export type Account = { id: string; customerId: string; accountType: "savings" | "current"; nickname: string; currency: "INR"; balance: number; status: "active" | "closed"; createdAt: string };
export type Transaction = { id: string; type: "credit" | "debit" | "transfer"; amount: number; currency: "INR"; reference: string; createdAt: string };
export const customers: Customer[] = []; export const accounts: Account[] = []; export const transactions = new Map<string, Transaction[]>();
let customerSequence = 1001; let accountSequence = 5001; let transactionSequence = 9001;
export function newCustomer(data: CustomerInput) { const customer: Customer = { id: `CUST-${customerSequence++}`, ...data, status: "active", createdAt: new Date().toISOString() }; customers.push(customer); return customer; }
export function newAccount(customerId: string, accountType: Account["accountType"], nickname: string, openingBalance: number) { const account: Account = { id: `ACC-${accountSequence++}`, customerId, accountType, nickname, currency: "INR", balance: openingBalance, status: "active", createdAt: new Date().toISOString() }; accounts.push(account); transactions.set(account.id, []); return account; }
export function addTransaction(accountId: string, type: Transaction["type"], amount: number, reference: string) { const transaction: Transaction = { id: `TXN-${transactionSequence++}`, type, amount, currency: "INR", reference, createdAt: new Date().toISOString() }; transactions.get(accountId)?.unshift(transaction); return transaction; }
export function resetBankData() { customers.splice(0); accounts.splice(0); transactions.clear(); customerSequence = 1001; accountSequence = 5001; transactionSequence = 9001; }
export function loadSampleBankData() {
  resetBankData();
  const customer = newCustomer({ firstName: "Betappa", middleName: "", lastName: "Bharath", suffix: "", shortName: "Bharath", maidenName: "", dateOfBirth: "2000-07-17", isMinorCustomer: false, gender: "M", birthCountry: "IN", nationality: "IN" });
  const primaryAccount = newAccount(customer.id, "savings", "Salary Account", 25000);
  const secondaryAccount = newAccount(customer.id, "savings", "Emergency Fund", 0);
  addTransaction(primaryAccount.id, "credit", 25000, "Opening balance");
  return { customer, primaryAccount, secondaryAccount };
}
