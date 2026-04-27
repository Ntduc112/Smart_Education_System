import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region:   process.env.S3_REGION ?? "us-east-1",
    credentials: {
        accessKeyId:     process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true, // bắt buộc với MinIO
});

const BUCKET = process.env.S3_BUCKET!;

export async function uploadFile(
    file:        Buffer,
    originalName: string,
    contentType: string,
): Promise<string> {
    const ext = originalName.split(".").pop() ?? "bin";
    const key = `${randomUUID()}.${ext}`;

    await client.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        file,
        ContentType: contentType,
    }));

    return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
}

export async function deleteFile(url: string): Promise<void> {
    const key = url.split(`/${BUCKET}/`)[1];
    if (!key) return;

    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
