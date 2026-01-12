import { NextRequest, NextResponse } from 'next/server';
import { uploadSettlementInvoice } from '@/lib/db/repasse';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settlementId = formData.get('settlementId') as string;

    if (!file || !settlementId) {
      return NextResponse.json({ error: 'File and settlementId are required' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'text/xml', 'application/xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and XML files are allowed' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const uniqueFileName = `invoices/${userId}/${nanoid()}.${fileExtension}`;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
    }

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`;

    const result = await uploadSettlementInvoice(
      Number(settlementId),
      fileUrl,
      file.name,
      fileExtension.toUpperCase()
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      fileUrl,
      message: 'Invoice uploaded successfully. Validation in progress.',
    });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    return NextResponse.json({ error: 'Failed to upload invoice' }, { status: 500 });
  }
}
