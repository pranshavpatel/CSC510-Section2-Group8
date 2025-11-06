# app/s3_service.py
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.config import settings
from typing import Optional
import uuid
import os


class S3Service:
    """Service for managing S3/Tigris object storage operations"""
    
    def __init__(self):
        if not all([
            settings.AWS_ACCESS_KEY_ID,
            settings.AWS_SECRET_ACCESS_KEY,
            settings.AWS_ENDPOINT_URL,
            settings.S3_BUCKET_NAME
        ]):
            raise ValueError("S3 configuration is incomplete. Please set all required environment variables.")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.AWS_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(signature_version='s3v4')
        )
        self.bucket_name = settings.S3_BUCKET_NAME
    
    def generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename to prevent collisions"""
        ext = os.path.splitext(original_filename)[1]
        unique_id = str(uuid.uuid4())
        return f"meal-images/{unique_id}{ext}"
    
    def generate_presigned_upload_url(
        self, 
        filename: str, 
        content_type: str,
        expires_in: int = 300  # 5 minutes
    ) -> tuple[str, str]:
        """
        Generate a presigned URL for uploading a file to S3
        
        Returns:
            tuple: (presigned_upload_url, public_get_url)
        """
        object_key = self.generate_unique_filename(filename)
        
        try:
            # Generate presigned URL for PUT operation
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_key,
                    'ContentType': content_type
                },
                ExpiresIn=expires_in,
                HttpMethod='PUT'
            )
            
            # Generate the public URL for GET operations
            public_url = f"{settings.AWS_ENDPOINT_URL}/{self.bucket_name}/{object_key}"
            
            return presigned_url, public_url
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
    def delete_object(self, image_url: str) -> bool:
        """
        Delete an object from S3
        
        Args:
            image_url: The full URL or object key of the image to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Extract object key from URL
            if image_url.startswith('http'):
                # Parse the key from the full URL
                # Format: https://endpoint/bucket/key
                parts = image_url.split(f"/{self.bucket_name}/")
                if len(parts) == 2:
                    object_key = parts[1]
                else:
                    # Try alternative parsing
                    object_key = image_url.split('/')[-2] + '/' + image_url.split('/')[-1]
            else:
                # Assume it's already an object key
                object_key = image_url
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            return True
        except ClientError as e:
            print(f"Failed to delete object: {str(e)}")
            return False
    
    def object_exists(self, object_key: str) -> bool:
        """Check if an object exists in S3"""
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except ClientError:
            return False


# Singleton instance
_s3_service: Optional[S3Service] = None


def get_s3_service() -> S3Service:
    """Get or create the S3 service instance"""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service

