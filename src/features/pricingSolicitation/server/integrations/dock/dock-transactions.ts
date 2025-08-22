"use server";
import { GetTransactionsResponse, Transaction } from "./dock-transactions-type";
export async function getTransactions(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const url = new URL(`${process.env.DOCK_API_URL}/v1/financial_transactions`);
  url.searchParams.append("dtInsert__goe", startDate);
  url.searchParams.append("dtInsert__loe", endDate);
  url.searchParams.append("limit", "1000");
  url.searchParams.append("transactionStatus", "AUTHORIZED");

  const transaction = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${process.env.DOCK_API_KEY}`,
    },
  });
  const data: GetTransactionsResponse = await transaction.json();

  return data.objects;
}
