import {ListObjectsV2Command} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client/s3Client";

export default async function Gallery(){

const objectListParams = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME as string,
})

const objectList = await s3Client.send(objectListParams)
console.log(objectList)



    return(
        <h1>Galeria de fotos</h1>
    )

}

