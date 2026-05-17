"""Cloudflare R2 helpers (S3-compatible API)."""
import os
from typing import Optional

import boto3
from botocore.config import Config

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg"}
PRESIGNED_EXPIRY_SECONDS = 900  # 15 min


def is_r2_configured() -> bool:
    required = (
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_BASE_URL",
    )
    return all(os.environ.get(key) for key in required)


def panorama_object_key(property_id: str) -> str:
    return f"properties/{property_id}/panorama.jpg"


def build_public_url(key: str) -> str:
    base = os.environ["R2_PUBLIC_BASE_URL"].rstrip("/")
    return f"{base}/{key}"


def _get_client():
    account_id = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def generate_presigned_put_url(property_id: str, content_type: str) -> dict[str, str]:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("content_type debe ser image/jpeg")

    key = panorama_object_key(property_id)
    client = _get_client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": os.environ["R2_BUCKET_NAME"],
            "Key": key,
            "ContentType": "image/jpeg",
        },
        ExpiresIn=PRESIGNED_EXPIRY_SECONDS,
    )
    return {
        "uploadUrl": upload_url,
        "publicUrl": build_public_url(key),
        "key": key,
    }


def is_valid_public_panorama_url(url: str) -> bool:
    base = os.environ.get("R2_PUBLIC_BASE_URL", "").rstrip("/")
    if not base:
        return False
    return url.startswith(base + "/")


def normalize_content_type(content_type: Optional[str]) -> str:
    if not content_type:
        return "image/jpeg"
    lowered = content_type.lower().split(";")[0].strip()
    if lowered == "image/jpg":
        return "image/jpeg"
    return lowered
