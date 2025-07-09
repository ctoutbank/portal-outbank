"use server";

import { createCronJobMonitoring } from "@/features/cronJob/actions";
import { Client, ClientConfig } from "pg";

// Database connection configuration
const dbConfig: ClientConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: true,
};

type Merchant = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  merchantId: string;
  name: string;
  documentId: string;
  corporateName: string;
  email: string;
  language: string;
  timezone: string;
  category: MerchantCategory;
};

type MerchantCategory = {
  name: string;
};

type Customer = {
  name: string;
};

export type Metadata = {
  limit: number;
  offset: number;
  total_count: number;
};

export type GetTransactionsResponse = {
  meta: Metadata;
  objects: Transaction[];
};

export type Transaction = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  slugAuthorizer: string;
  authorizer: any;
  slugTerminal: string;
  terminal: any;
  slugMerchant: string;
  merchant: Merchant;
  slugCustomer: string;
  customer: Customer;
  salesChannel: string;
  authorizerMerchantId: string;
  authorizerTerminalId: string;
  muid: string;
  currency: string;
  totalAmount: number;
  transactionStatus: string;
  productType: string;
  rrn: string;
  firstDigits: string;
  lastDigits: string;
  productOrIssuer: string;
  settlementManagementType: string;
  method: string;
  brand: string;
  cancelling: boolean;
  splitType: string;
};

// Function to fetch data from an API
async function fetchData(offset: number) {
  try {
    const response = await fetch(
      `${process.env.DOCK_API_URL_TRANSACTIONS}/v1/financial_transactions?limit=1000&offset=${offset}`,
      {
        headers: {
          Authorization: process.env.DOCK_API_KEY || "", // Replace with your actual token
        },
      }
    ); // Replace with your API URL

    const data: GetTransactionsResponse = await response.json();
    console.log(data);
    return data.objects;
  } catch (error: any) {
    console.error("Error fetching API data:", error.message);
    throw error;
  }
}

// Function to insert data into the database

async function getTransactionTotalCount(): Promise<number> {
  const client = new Client(dbConfig as ClientConfig);
  try {
    await client.connect();
    const query = "SELECT COUNT(1) FROM transactions";
    const result = await client.query(query);
    console.log("Total count:", result.rows[0].count);
    return result.rows[0].count || 0;
  } catch (error: any) {
    console.error("Error getting transaction total count:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function saveToDatabaseBatch(transactions: Transaction[]) {
  const client = new Client(dbConfig as ClientConfig);

  try {
    await client.connect();

    // Prepare the query
    const query = `
      INSERT INTO transactions (
        slug, active, dt_insert, dt_update, slug_authorizer, slug_terminal, slug_merchant,
        merchant_type, merchant_name, merchant_corporate_name, slug_customer, customer_name,
        sales_channel, authorizer_merchant_id, muid, currency, total_amount,
        transaction_status, product_type, rrn, first_digits, lastdigits, productorissuer,
        settlementmanagementtype, method_type, brand, cancelling, split_type
      ) VALUES ${transactions
        .map(
          (_, index) =>
            `(
              $${index * 28 + 1}, $${index * 28 + 2}, $${index * 28 + 3}, $${
              index * 28 + 4
            },
              $${index * 28 + 5}, $${index * 28 + 6}, $${index * 28 + 7}, $${
              index * 28 + 8
            },
              $${index * 28 + 9}, $${index * 28 + 10}, $${index * 28 + 11}, $${
              index * 28 + 12
            },
              $${index * 28 + 13}, $${index * 28 + 14}, $${index * 28 + 15}, $${
              index * 28 + 16
            },
              $${index * 28 + 17}, $${index * 28 + 18}, $${index * 28 + 19}, $${
              index * 28 + 20
            },
              $${index * 28 + 21}, $${index * 28 + 22}, $${index * 28 + 23}, $${
              index * 28 + 24
            },
              $${index * 28 + 25}, $${index * 28 + 26}, $${index * 28 + 27}, $${
              index * 28 + 28
            }
            )`
        )
        .join(",")}
      ON CONFLICT (slug) DO NOTHING
    `;

    // Flatten values for batch insertion
    const values = transactions.flatMap((transaction) => [
      transaction.slug,
      transaction.active,
      transaction.dtInsert,
      transaction.dtUpdate,
      transaction.slugAuthorizer,
      transaction.slugTerminal,
      transaction.slugMerchant,
      transaction.merchant?.category?.name,
      transaction.merchant?.name,
      transaction.merchant?.corporateName,
      transaction.slugCustomer,
      transaction.customer?.name,
      transaction.salesChannel,
      transaction.authorizerMerchantId,
      transaction.muid,
      transaction.currency,
      transaction.totalAmount,
      transaction.transactionStatus,
      transaction.productType,
      transaction.rrn,
      transaction.firstDigits,
      transaction.lastDigits,
      transaction.productOrIssuer,
      transaction.settlementManagementType,
      transaction.method,
      transaction.brand,
      transaction.cancelling,
      transaction.splitType,
    ]);

    // Execute the query
    await client.query(query, values);
    console.log(`Batch of ${transactions.length} transactions inserted.`);
  } catch (error: any) {
    console.error("Error saving batch to database:", error.message);
  } finally {
    await client.end();
  }
}

// Option 1: Using an async IIFE
export async function syncTransactions() {
  try {
    // Fetch data from API
    const totalCount = await getTransactionTotalCount();
    await createCronJobMonitoring({
      jobName: "Sincronização de transações",
      status: "pending",
      startTime: new Date().toISOString(),
      logMessage: `Total count: ${totalCount}`,
    });
    console.log(`Total count: ${totalCount}`);
    const data = await fetchData(totalCount);
    // Save each object in the data array to the database
    console.log(`Data: ${data}`);
    await createCronJobMonitoring({
      jobName: "Sincronização de transações",
      status: "dados",
      startTime: new Date().toISOString(),
      logMessage: `Data: ${data}`,
    });
    await saveToDatabaseBatch(data);
    await createCronJobMonitoring({
      jobName: "Sincronização de transações",
      status: "finalizado",
      startTime: new Date().toISOString(),
      logMessage: `Finalizado`,
    });
  } catch (error: any) {
    console.error("Error during execution:", error.message);
  }
}
