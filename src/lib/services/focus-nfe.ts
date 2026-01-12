const FOCUS_NFE_BASE_URL = process.env.FOCUS_NFE_BASE_URL || 'https://api.focusnfe.com.br';
const FOCUS_NFE_TOKEN = process.env.FOCUS_NFE_TOKEN || '';

interface NFValidationResult {
  valid: boolean;
  accessKey?: string;
  invoiceNumber?: string;
  invoiceValue?: number;
  issuerCnpj?: string;
  issuerName?: string;
  sefazResponse?: any;
  error?: string;
}

export async function validateNFeByAccessKey(accessKey: string): Promise<NFValidationResult> {
  if (!FOCUS_NFE_TOKEN) {
    console.warn('[Focus NFe] Token not configured, using mock validation');
    return mockValidation(accessKey);
  }

  try {
    const response = await fetch(`${FOCUS_NFE_BASE_URL}/v2/nfe/${accessKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(FOCUS_NFE_TOKEN + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        valid: false,
        error: `SEFAZ validation failed: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    return {
      valid: data.status === 'autorizado' || data.status === 'aprovado',
      accessKey: data.chave_nfe || accessKey,
      invoiceNumber: data.numero || '',
      invoiceValue: parseFloat(data.valor_total) || 0,
      issuerCnpj: data.cnpj_emitente || '',
      issuerName: data.nome_emitente || '',
      sefazResponse: data,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `API error: ${error.message}`,
    };
  }
}

export async function validateNFSeByAccessKey(accessKey: string, cityCode?: string): Promise<NFValidationResult> {
  if (!FOCUS_NFE_TOKEN) {
    console.warn('[Focus NFe] Token not configured, using mock validation');
    return mockValidation(accessKey);
  }

  try {
    const response = await fetch(`${FOCUS_NFE_BASE_URL}/v2/nfse/${accessKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(FOCUS_NFE_TOKEN + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        valid: false,
        error: `SEFAZ validation failed: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    return {
      valid: data.status === 'autorizado' || data.status === 'aprovado',
      accessKey: accessKey,
      invoiceNumber: data.numero || '',
      invoiceValue: parseFloat(data.valor_servicos) || 0,
      issuerCnpj: data.cnpj_prestador || '',
      issuerName: data.razao_social_prestador || '',
      sefazResponse: data,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `API error: ${error.message}`,
    };
  }
}

export function extractAccessKeyFromXML(xmlContent: string): string | null {
  const chaveMatch = xmlContent.match(/(?:chNFe|Id).*?(\d{44})/);
  if (chaveMatch) {
    return chaveMatch[1];
  }
  
  const infNFeMatch = xmlContent.match(/infNFe\s+Id="NFe(\d{44})"/);
  if (infNFeMatch) {
    return infNFeMatch[1];
  }

  return null;
}

export function detectInvoiceType(accessKey: string): 'NFe' | 'NFSe' | 'unknown' {
  if (accessKey.length === 44 && /^\d{44}$/.test(accessKey)) {
    return 'NFe';
  }
  return 'unknown';
}

function mockValidation(accessKey: string): NFValidationResult {
  const isValidFormat = /^\d{44}$/.test(accessKey);
  
  if (!isValidFormat) {
    return {
      valid: false,
      error: 'Invalid access key format. Must be 44 digits.',
    };
  }

  return {
    valid: true,
    accessKey,
    invoiceNumber: accessKey.substring(25, 34),
    invoiceValue: 100 + Math.random() * 1000,
    issuerCnpj: accessKey.substring(6, 20),
    issuerName: 'Mock Company LTDA',
    sefazResponse: { status: 'mock_approved', message: 'Mock validation - Focus NFe token not configured' },
  };
}

export async function validateInvoice(accessKey: string): Promise<NFValidationResult> {
  const type = detectInvoiceType(accessKey);
  
  if (type === 'NFe') {
    return validateNFeByAccessKey(accessKey);
  } else if (type === 'NFSe') {
    return validateNFSeByAccessKey(accessKey);
  }
  
  return {
    valid: false,
    error: 'Could not determine invoice type from access key',
  };
}
