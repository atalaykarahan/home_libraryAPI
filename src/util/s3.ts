import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../util/validateEnv";

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

export async function getFileToS3(fileName: string) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new GetObjectCommand(getObjectParams);
  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error("Error get file to S3:", error);
    return false;
  }
}

export async function removeFileToS3(fileName: string) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  const command = new DeleteObjectCommand(getObjectParams);

  try {
    await s3.send(command);
  } catch (error) {
    console.error("Error get file to S3:", error);
  }
}
