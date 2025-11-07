# app/routers/s3.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.s3_service import get_s3_service, S3Service
from app.auth import current_user

router = APIRouter(prefix="/api/s3", tags=["s3"])


class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str


class PresignedUrlResponse(BaseModel):
    upload_url: str
    public_url: str


class DeleteImageRequest(BaseModel):
    image_url: str


class DeleteImageResponse(BaseModel):
    success: bool
    message: str


@router.post("/presigned-upload-url", response_model=PresignedUrlResponse)
async def get_presigned_upload_url(
    request: PresignedUrlRequest,
    user = Depends(current_user),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Generate a presigned URL for uploading an image to S3.
    The URL is valid for 5 minutes.
    """
    try:
        # Validate content type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if request.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid content type. Allowed types: {', '.join(allowed_types)}"
            )
        
        upload_url, public_url = s3_service.generate_presigned_upload_url(
            filename=request.filename,
            content_type=request.content_type,
            expires_in=300  # 5 minutes
        )
        
        return PresignedUrlResponse(
            upload_url=upload_url,
            public_url=public_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )


@router.delete("/delete-image", response_model=DeleteImageResponse)
async def delete_image(
    request: DeleteImageRequest,
    user = Depends(current_user),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Delete an image from S3.
    This should be called when a meal image is being replaced or the meal is deleted.
    """
    try:
        if not request.image_url:
            raise HTTPException(status_code=400, detail="Image URL is required")
        
        success = s3_service.delete_object(request.image_url)
        
        if success:
            return DeleteImageResponse(
                success=True,
                message="Image deleted successfully"
            )
        else:
            return DeleteImageResponse(
                success=False,
                message="Failed to delete image"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete image: {str(e)}"
        )

