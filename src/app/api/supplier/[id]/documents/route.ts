import { NextRequest, NextResponse } from "next/server";
import { fornecedoresRepository } from "@/lib/db/fornecedores";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest, { params }: { params: {id: string} }) {

    try{
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const uploadedDocs = [];

        for (const file of files){
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(process.cwd(), 'public', 'uploads', 'fornecedores', fileName);

            await writeFile(filePath, buffer);

            const doc = await fornecedoresRepository.uploadDocument(
                params.id,
               
                `/uploads/fornecedores/${fileName}`
            );

            uploadedDocs.push(doc);
        }

        return NextResponse.json(uploadedDocs, {status: 201});
    } catch (error){
        console.error('Error uploading documents in API route:', error);
        return NextResponse.json({ error: 'Error uploading documents' }, { status: 500 });
    }
    

}

export async function GET(request: NextRequest, { params }: { params: {id: string} }) {
    try{
        const documents = await fornecedoresRepository.getDocuments(params.id);
        return NextResponse.json(documents);
    }
    catch (error){
        console.error('Error fetching documents in API route:', error);
        return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 });
    }

}