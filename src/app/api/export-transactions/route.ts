import { getTransactions } from "@/features/transactions/serverActions/transaction";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const page = 1;
    const pageSize = 10000; // ou outro valor grande pra exportação

    const status = searchParams.get("status") || undefined;
    const merchant = searchParams.get("merchant") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const productType = searchParams.get("productType") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const nsu = searchParams.get("nsu") || undefined;
    const method = searchParams.get("method") || undefined;
    const salesChannel = searchParams.get("salesChannel") || undefined;
    const terminal = searchParams.get("terminal") || undefined;
    const valueMin = searchParams.get("valueMin") || undefined;
    const valueMax = searchParams.get("valueMax") || undefined;
    const customer = searchParams.get("customer") || undefined;

    const data = await getTransactions(
        page,
        pageSize,
        status,
        merchant,
        dateFrom,
        dateTo,
        productType,
        brand,
        nsu,
        method,
        salesChannel,
        terminal,
        valueMin,
        valueMax,
        customer,
        { sortBy: "dtInsert", sortOrder: "desc" }
    );

    return NextResponse.json({ transactions: data.transactions });
}

