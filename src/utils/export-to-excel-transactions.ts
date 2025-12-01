import ExcelJS from "exceljs";
import {
    formatCurrency,
    formatDate,
} from "@/lib/utils";

interface ResumoItem {
    tipo: string;
    bandeira: string;
    quantidade: number;
    valorTotal: number;
    quantidadeNegada: number;
    valorTotalNegado: number;
}

interface TotaisTipo {
    quantidade: number;
    valorTotal: number;
    quantidadeNegada: number;
    valorTotalNegado: number;
}

export async function exportToExcelTransactions({
                                                    transactions,
                                                    fileName,
                                                }: {
    transactions: any[];
    fileName: string;
}) {
    const workbook = new ExcelJS.Workbook();

    if (!transactions || transactions.length === 0) {
        console.warn("Não há transações para gerar o relatório");
        return;
    }

    const BANDEIRAS = [
        "MASTERCARD",
        "VISA",
        "ELO",
        "AMEX",
        "HIPERCARD",
        "CABAL",
        "NÃO IDENTIFICADA",
    ];
    const TIPOS = ["DEBIT", "CREDIT", "PREPAID_CREDIT", "PREPAID_DEBIT"];

    const dadosPorBandeira: { [key: string]: any[] } = {};
    const resumoGeral: ResumoItem[] = [];

    BANDEIRAS.forEach((bandeira) => {
        TIPOS.forEach((tipo) => {
            const chaveSheet = `${bandeira}-${tipo}`;
            dadosPorBandeira[chaveSheet] = [];
            resumoGeral.push({
                tipo,
                bandeira,
                quantidade: 0,
                valorTotal: 0,
                quantidadeNegada: 0,
                valorTotalNegado: 0,
            });
        });
    });

    dadosPorBandeira["PIX-PIX"] = [];
    resumoGeral.push({
        tipo: "PIX",
        bandeira: "PIX",
        quantidade: 0,
        valorTotal: 0,
        quantidadeNegada: 0,
        valorTotalNegado: 0,
    });

    transactions.forEach((item) => {
        const bandeira = item.brand || "NÃO IDENTIFICADA";
        const tipo = item.productType || "Não Especificado";
        const valor = Number(item.amount) || 0;
        const status = item.transactionStatus || "";
        const fee = Number(item.feeAdmin) || 0;
        const transactionMdr = Number(item.transactionMdr) || 0;
        const lucro = Number(item.lucro) || 0;
        const repasse = Number(item.repasse) || 0;

        const rowData = {
            Data: (() => {
                const data = new Date(item.dtInsert || "");
                data.setHours(data.getHours() - 3);
                const dateStr = formatDate(data);
                const timeStr = data.toLocaleTimeString("pt-BR");
                return `${dateStr} ${timeStr}`;
            })(),
            "NSU / Id": item.nsu || "0,0",
            Terminal: item.terminalLogicalNumber || "0,0",
            Valor: `R$ ${valor.toFixed(2)}`,
            Bandeira: bandeira,
            Tipo: tipo,
            Status: status || "-",
            Fee_Admin: `${fee.toFixed(2)}%`,
            TransactionMdr: `${transactionMdr.toFixed(2)}%`,
            Lucro: `${lucro.toFixed(2)}%`,
            Repasse: `R$ ${repasse.toFixed(2)}`,
        };

        if (bandeira === "PIX" && tipo === "PIX") {
            dadosPorBandeira["PIX-PIX"].push(rowData);
            const itemResumo = resumoGeral.find(
                (r) => r.tipo === "PIX" && r.bandeira === "PIX"
            );
            if (itemResumo) {
                if (["AUTHORIZED", "PRE_AUTHORIZED", "PENDING"].includes(status)) {
                    itemResumo.quantidade++;
                    itemResumo.valorTotal += valor;
                } else {
                    itemResumo.quantidadeNegada++;
                    itemResumo.valorTotalNegado += valor;
                }
            }
        } else {
            const chaveSheet = `${bandeira}-${tipo}`;
            dadosPorBandeira[chaveSheet]?.push(rowData);
            const itemResumo = resumoGeral.find(
                (r) => r.tipo === tipo && r.bandeira === bandeira
            );
            if (itemResumo) {
                if (["AUTHORIZED", "PRE_AUTHORIZED", "PENDING"].includes(status)) {
                    itemResumo.quantidade++;
                    itemResumo.valorTotal += valor;
                } else {
                    itemResumo.quantidadeNegada++;
                    itemResumo.valorTotalNegado += valor;
                }
            }
        }
    });

    resumoGeral.sort((a, b) => {
        if (a.tipo === b.tipo) return a.bandeira.localeCompare(b.bandeira);
        return a.tipo.localeCompare(b.tipo);
    });

    const totalGeral: TotaisTipo = resumoGeral.reduce(
        (acc, item) => ({
            quantidade: acc.quantidade + item.quantidade,
            valorTotal: acc.valorTotal + item.valorTotal,
            quantidadeNegada: acc.quantidadeNegada + item.quantidadeNegada,
            valorTotalNegado: acc.valorTotalNegado + item.valorTotalNegado,
        }),
        { quantidade: 0, valorTotal: 0, quantidadeNegada: 0, valorTotalNegado: 0 }
    );

    // --- ABA RESUMO ---
    const resumoSheet = workbook.addWorksheet("Resumo Geral");
    resumoSheet.columns = [
        { header: "Tipo", key: "tipo", width: 20 },
        { header: "Bandeira", key: "bandeira", width: 20 },
        { header: "Transações", key: "quantidade", width: 15 },
        { header: "% Transações", key: "porcentagemQuantidade", width: 15 },
        { header: "Valor", key: "valorTotal", width: 20 },
        { header: "% Valor Total", key: "porcentagemValor", width: 15 },
        { header: "Transações Negadas", key: "quantidadeNegada", width: 20 },
        { header: "Valor Negado", key: "valorTotalNegado", width: 20 },
    ];

    resumoGeral.forEach((item) => {
        resumoSheet.addRow({
            tipo: item.tipo,
            bandeira: item.bandeira,
            quantidade: item.quantidade,
            porcentagemQuantidade: `${((item.quantidade / totalGeral.quantidade) * 100).toFixed(2)}%`,
            valorTotal: formatCurrency(item.valorTotal),
            porcentagemValor: `${((item.valorTotal / totalGeral.valorTotal) * 100).toFixed(2)}%`,
            quantidadeNegada: item.quantidadeNegada,
            valorTotalNegado: formatCurrency(item.valorTotalNegado),
        });
    });

    resumoSheet.addRow([]);

    // --- TOTAIS POR TIPO ---
    const totalPorTipo: Record<string, TotaisTipo> = resumoGeral.reduce((acc, item) => {
        if (!acc[item.tipo]) acc[item.tipo] = { quantidade: 0, valorTotal: 0, quantidadeNegada: 0, valorTotalNegado: 0 };
        acc[item.tipo].quantidade += item.quantidade;
        acc[item.tipo].valorTotal += item.valorTotal;
        acc[item.tipo].quantidadeNegada += item.quantidadeNegada;
        acc[item.tipo].valorTotalNegado += item.valorTotalNegado;
        return acc;
    }, {} as Record<string, TotaisTipo>);

    ["CREDIT","DEBIT","PREPAID_CREDIT","PREPAID_DEBIT","PIX"].forEach((tipo) => {
        if (!totalPorTipo[tipo]) totalPorTipo[tipo] = { quantidade: 0, valorTotal: 0, quantidadeNegada: 0, valorTotalNegado: 0 };
    });

    Object.entries(totalPorTipo).forEach(([tipo, totais]) => {
        const row = resumoSheet.addRow({
            tipo: `Total ${tipo}`,
            bandeira: "",
            quantidade: totais.quantidade,
            porcentagemQuantidade: `${((totais.quantidade / totalGeral.quantidade) * 100).toFixed(2)}%`,
            valorTotal: formatCurrency(totais.valorTotal),
            porcentagemValor: `${((totais.valorTotal / totalGeral.valorTotal) * 100).toFixed(2)}%`,
            quantidadeNegada: totais.quantidadeNegada,
            valorTotalNegado: formatCurrency(totais.valorTotalNegado),
        });
        row.font = { bold: true };
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0" } };
    });

    resumoSheet.addRow([]);

    // --- TOTAL GERAL ---
    const rowTotalGeral = resumoSheet.addRow({
        tipo: "TOTAL GERAL",
        bandeira: "",
        quantidade: totalGeral.quantidade,
        porcentagemQuantidade: "100%",
        valorTotal: formatCurrency(totalGeral.valorTotal),
        porcentagemValor: "100%",
        quantidadeNegada: totalGeral.quantidadeNegada,
        valorTotalNegado: formatCurrency(totalGeral.valorTotalNegado),
    });
    rowTotalGeral.font = { bold: true, size: 12 };
    rowTotalGeral.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD700" } };

    // --- PLANILHAS DE TRANSAÇÕES ---
    const todasSheet = workbook.addWorksheet("Todas as Transações");
    todasSheet.columns = Object.keys(transactions[0]).map((k) => ({
        header: k === "amount" ? "Valor" :
            k === "feeAdmin" ? "Fee Admin" :
                k === "transactionMdr" ? "Transaction MDR" :
                    k === "lucro" ? "Lucro" :
                        k === "repasse" ? "Repasse" :
                            k,
        key: k,
        width: 20
    }));
    transactions.forEach((item) => {
        const row = Object.fromEntries(
            Object.entries(item).map(([key, value]) => [key, value ?? (key.includes("amount") || key.includes("repasse") ? "R$ 0,0" : "0,0")])
        );
        todasSheet.addRow(row);
    });

    Object.entries(dadosPorBandeira).forEach(([sheetName, rows]) => {
        const ws = workbook.addWorksheet(sheetName);
        if (rows.length > 0) {
            ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: 20 }));
            rows.forEach((r) => ws.addRow(r));
        }
    });

    // --- DOWNLOAD ---
    const buffer = await workbook.xlsx.writeBuffer();
    // Converter ArrayBuffer para Blob
    const blob = new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

