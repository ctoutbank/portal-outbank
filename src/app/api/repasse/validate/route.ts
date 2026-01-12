import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceValidation } from '@/lib/db/repasse';
import { validateInvoice, extractAccessKeyFromXML } from '@/lib/services/focus-nfe';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { sql } from '@vercel/postgres';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function isAdminUser(userId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT user_type FROM users WHERE id = $1
  `, [userId]);
  return rows[0]?.user_type === 'SUPER_ADMIN' || rows[0]?.user_type === 'ISO_PORTAL_ADMIN';
}

export async function POST(request: NextRequest) {
  try {
    let userId: number;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      userId = 1;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      userId = payload.id;
    }

    const body = await request.json();
    const { invoiceId, accessKey: providedAccessKey } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const { rows: invoiceRows } = await sql.query(`
      SELECT si.*, ums.id_user 
      FROM settlement_invoices si
      JOIN user_monthly_settlements ums ON si.id_settlement = ums.id
      WHERE si.id = $1
    `, [invoiceId]);

    if (!invoiceRows[0]) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceRows[0];
    const isAdmin = await isAdminUser(userId);
    
    if (!isAdmin && invoice.id_user !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let accessKey = providedAccessKey || invoice.access_key;

    if (!accessKey && invoice.file_url && invoice.file_type === 'XML') {
      try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const key = invoice.file_url.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        const response = await s3Client.send(command);
        const xmlContent = await response.Body?.transformToString();
        
        if (xmlContent) {
          accessKey = extractAccessKeyFromXML(xmlContent);
        }
      } catch (err) {
        console.error('Error reading XML from S3:', err);
      }
    }

    if (!accessKey) {
      return NextResponse.json({ 
        error: 'Could not extract access key. Please provide it manually.',
        requiresManualKey: true,
      }, { status: 400 });
    }

    const validationResult = await validateInvoice(accessKey);

    const updateResult = await updateInvoiceValidation(
      invoiceId,
      validationResult.valid ? 'valid' : 'invalid',
      validationResult.accessKey,
      validationResult.invoiceNumber,
      validationResult.invoiceValue,
      validationResult.issuerCnpj,
      validationResult.issuerName,
      validationResult.sefazResponse,
      validationResult.error
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      valid: validationResult.valid,
      message: validationResult.valid 
        ? 'Invoice validated successfully. User is now eligible for payment.'
        : `Invoice validation failed: ${validationResult.error}`,
      details: validationResult,
    });
  } catch (error) {
    console.error('Error validating invoice:', error);
    return NextResponse.json({ error: 'Failed to validate invoice' }, { status: 500 });
  }
}
