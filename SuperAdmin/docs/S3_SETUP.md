# AWS S3 Setup Guide

This guide explains how to configure AWS S3 for file uploads in the SuperAdmin panel.

## Required AWS S3 Permissions

The AWS IAM user needs the following permissions to upload files to S3:

### Minimum Required Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::notes-market-bucket/courses/*"
    }
  ]
}
```

### Recommended Permissions (for full functionality)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::notes-market-bucket/courses/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::notes-market-bucket",
      "Condition": {
        "StringLike": {
          "s3:prefix": "courses/*"
        }
      }
    }
  ]
}
```

## IAM Policy Setup

1. Go to AWS IAM Console
2. Select your IAM user (e.g., `bucketusertest`)
3. Click "Add permissions" → "Create inline policy"
4. Use JSON editor and paste the recommended permissions above
5. Replace `notes-market-bucket` with your actual bucket name
6. Save the policy

## Bucket Policy for Public Access (Optional)

If you want files to be publicly accessible, add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::notes-market-bucket/courses/*"
    }
  ]
}
```

## System Time Sync Issue

If you encounter `RequestTimeTooSkewed` error:

### Windows:
1. Open Command Prompt as Administrator
2. Run: `w32tm /resync`
3. Or sync manually via Date & Time settings

### Linux/Mac:
```bash
sudo ntpdate -s time.nist.gov
# or
sudo timedatectl set-ntp true
```

## Environment Variables

Ensure these are set in your `.env` file:

```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=notes-market-bucket
```

## Testing S3 Connection

You can test if your S3 configuration is correct by checking the server logs on startup. You should see:

```
✅ AWS S3 configured successfully for file uploads
📦 S3 Bucket: notes-market-bucket
🌍 S3 Region: eu-north-1
```

## Troubleshooting

### Error: AccessDenied
- Check IAM user permissions
- Ensure `s3:PutObject` permission is granted
- Verify bucket name is correct
- Check if there's an explicit deny policy

### Error: RequestTimeTooSkewed
- Sync your system clock
- Maximum allowed skew is 15 minutes (900000 milliseconds)

### Error: NoSuchBucket
- Verify bucket name in environment variables
- Ensure bucket exists in the specified region
- Check AWS credentials have access to the bucket

## File Storage Structure

Files are stored in S3 with the following structure:

```
notes-market-bucket/
  └── courses/
      ├── image-{timestamp}-{random}.jpg
      └── pdf-{timestamp}-{random}.pdf
```

## S3 URL Format

Uploaded files will have URLs like:
```
https://notes-market-bucket.s3.eu-north-1.amazonaws.com/courses/image-1234567890-123456789.jpg
```
