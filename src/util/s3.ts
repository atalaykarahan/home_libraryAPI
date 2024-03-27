import env from "../util/validateEnv";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const bucketName = env.BUCKET_NAME;
const bucketRegion = env.BUCKET_REGION;
const bucketAccessKey = env.BUCKET_ACCESS_KEY;
const bucketSecretAccesskey = env.BUCKET_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretAccesskey,
  },
});

export async function uploadFileToS3(
  fileName: string,
  file: Express.Multer.File
) {
    //burdaki key uniq olmalı image name o oluyor çünkü
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return false;
  }
}
