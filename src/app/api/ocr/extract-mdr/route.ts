import { NextRequest, NextResponse } from 'next/server';
import { TextractClient, AnalyzeDocumentCommand, Block, Relationship } from '@aws-sdk/client-textract';

function createTextractClient() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  
  console.log('[OCR] Configurando Textract:', {
    region,
    hasAccessKeyId: !!accessKeyId && accessKeyId.length > 0,
    accessKeyIdLength: accessKeyId.length,
    hasSecretKey: !!secretAccessKey && secretAccessKey.length > 0,
  });
  
  return new TextractClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

interface ExtractedRate {
  brand: string;
  productType: string;
  rate: string;
}

interface ExtractedMdrData {
  pos: ExtractedRate[];
  online: ExtractedRate[];
  pixPos?: string;
  pixOnline?: string;
  antecipacaoPos?: string;
  antecipacaoOnline?: string;
}

const BRAND_MAPPINGS: Record<string, string> = {
  'visa': 'VISA',
  'master': 'MASTERCARD',
  'mastercard': 'MASTERCARD',
  'elo': 'ELO',
  'hipercard': 'HIPERCARD',
  'hiper': 'HIPERCARD',
  'amex': 'AMEX',
  'american express': 'AMEX',
  'cabal': 'CABAL',
  'outras': 'OTHER',
  'outros': 'OTHER',
};

const PRODUCT_TYPE_MAPPINGS: Record<string, string> = {
  'débito': 'DEBIT',
  'debito': 'DEBIT',
  'crédito à vista': 'CREDIT',
  'credito a vista': 'CREDIT',
  'crédito a vista': 'CREDIT',
  'credito à vista': 'CREDIT',
  'crédito': 'CREDIT',
  'credito': 'CREDIT',
  'parcelamento 2 a 6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  'parcelamento 2 à 6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  'parcelamento 2x a 6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  '2 a 6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  '2 à 6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  '2x-6x': 'CREDIT_INSTALLMENTS_2_TO_6',
  'parcelamento 7 a 12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  'parcelamento 7 à 12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  'parcelamento 7x a 12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  '7 a 12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  '7 à 12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  '7x-12x': 'CREDIT_INSTALLMENTS_7_TO_12',
  'voucher': 'VOUCHER',
  'vale refeição': 'VOUCHER',
  'vale alimentação': 'VOUCHER',
  'pré-pago': 'PREPAID_CREDIT',
  'pre-pago': 'PREPAID_CREDIT',
  'prepago': 'PREPAID_CREDIT',
  'pré pago': 'PREPAID_CREDIT',
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findBrand(text: string): string | null {
  const normalized = normalizeText(text);
  for (const [key, value] of Object.entries(BRAND_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
}

function findProductType(text: string): string | null {
  const normalized = normalizeText(text);
  for (const [key, value] of Object.entries(PRODUCT_TYPE_MAPPINGS)) {
    const normalizedKey = normalizeText(key);
    if (normalized.includes(normalizedKey)) {
      return value;
    }
  }
  return null;
}

function parseRate(text: string): string | null {
  const cleaned = text.replace(/[^\d,.\-%]/g, '').trim();
  const match = cleaned.match(/(\d+[,.]?\d*)/);
  if (match) {
    return match[1].replace(',', '.');
  }
  return null;
}

function getBlockText(block: Block, blocksMap: Map<string, Block>): string {
  if (block.Text) return block.Text;
  
  if (block.Relationships) {
    const childRel = block.Relationships.find((r: Relationship) => r.Type === 'CHILD');
    if (childRel && childRel.Ids) {
      return childRel.Ids
        .map(id => blocksMap.get(id)?.Text || '')
        .join(' ')
        .trim();
    }
  }
  return '';
}

function extractTableData(blocks: Block[]): { tables: string[][][], rawText: string } {
  const blocksMap = new Map<string, Block>();
  blocks.forEach(block => {
    if (block.Id) blocksMap.set(block.Id, block);
  });

  const tables: string[][][] = [];
  const tableBlocks = blocks.filter(b => b.BlockType === 'TABLE');

  for (const tableBlock of tableBlocks) {
    const cells: Map<string, { row: number; col: number; text: string }> = new Map();
    
    if (tableBlock.Relationships) {
      const cellRel = tableBlock.Relationships.find((r: Relationship) => r.Type === 'CHILD');
      if (cellRel && cellRel.Ids) {
        for (const cellId of cellRel.Ids) {
          const cellBlock = blocksMap.get(cellId);
          if (cellBlock && cellBlock.BlockType === 'CELL') {
            const rowIndex = cellBlock.RowIndex || 0;
            const colIndex = cellBlock.ColumnIndex || 0;
            const text = getBlockText(cellBlock, blocksMap);
            cells.set(`${rowIndex}-${colIndex}`, { row: rowIndex, col: colIndex, text });
          }
        }
      }
    }

    const maxRow = Math.max(...Array.from(cells.values()).map(c => c.row), 0);
    const maxCol = Math.max(...Array.from(cells.values()).map(c => c.col), 0);
    
    const table: string[][] = [];
    for (let r = 1; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 1; c <= maxCol; c++) {
        const cell = cells.get(`${r}-${c}`);
        row.push(cell?.text || '');
      }
      table.push(row);
    }
    
    if (table.length > 0) {
      tables.push(table);
    }
  }

  const rawText = blocks
    .filter(b => b.BlockType === 'LINE')
    .map(b => b.Text || '')
    .join('\n');

  return { tables, rawText };
}

function processExtractedTables(tables: string[][][]): ExtractedMdrData {
  const result: ExtractedMdrData = {
    pos: [],
    online: [],
  };

  for (const table of tables) {
    if (table.length === 0) continue;

    const headerRow = table[0];
    const brandColumns: Map<number, string> = new Map();

    headerRow.forEach((cell, index) => {
      const brand = findBrand(cell);
      if (brand) {
        brandColumns.set(index, brand);
      }
    });

    let isOnlineSection = false;

    for (let rowIdx = 1; rowIdx < table.length; rowIdx++) {
      const row = table[rowIdx];
      if (row.length === 0) continue;

      const firstCell = row[0].toLowerCase();
      
      if (firstCell.includes('online') || firstCell.includes('cnp') || firstCell.includes('e-commerce')) {
        isOnlineSection = true;
        continue;
      }
      
      if (firstCell.includes('pos') || firstCell.includes('presencial') || firstCell.includes('cp ')) {
        isOnlineSection = false;
        continue;
      }

      const productType = findProductType(row[0]);
      if (!productType) continue;

      brandColumns.forEach((brand, colIndex) => {
        if (colIndex < row.length) {
          const rate = parseRate(row[colIndex]);
          if (rate) {
            const rateData: ExtractedRate = {
              brand,
              productType,
              rate,
            };

            if (isOnlineSection) {
              result.online.push(rateData);
            } else {
              result.pos.push(rateData);
            }
          }
        }
      });
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const extractType = formData.get('extractType') as string || 'both';

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: buffer,
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    });

    const textractClient = createTextractClient();
    const response = await textractClient.send(command);
    
    if (!response.Blocks) {
      return NextResponse.json({ error: 'Não foi possível extrair dados da imagem' }, { status: 400 });
    }

    const { tables, rawText } = extractTableData(response.Blocks);
    const extractedData = processExtractedTables(tables);

    const result: any = {
      success: true,
      extractType,
      data: {},
    };

    if (extractType === 'pos' || extractType === 'both') {
      result.data.pos = extractedData.pos;
      result.data.pixPos = extractedData.pixPos;
      result.data.antecipacaoPos = extractedData.antecipacaoPos;
    }

    if (extractType === 'online' || extractType === 'both') {
      result.data.online = extractedData.online;
      result.data.pixOnline = extractedData.pixOnline;
      result.data.antecipacaoOnline = extractedData.antecipacaoOnline;
    }

    result.debug = {
      tablesFound: tables.length,
      rawTextPreview: rawText.substring(0, 500),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao processar OCR:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar imagem' },
      { status: 500 }
    );
  }
}
