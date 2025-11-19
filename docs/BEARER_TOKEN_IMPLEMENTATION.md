# AWS Bearer Token Implementation Summary

## Overview
Added support for AWS Bedrock authentication using OpenAI-compatible endpoint with bearer token (`AWS_BEARER_TOKEN_BEDROCK`).

## Authentication Priority Order
1. **AWS_BEARER_TOKEN_BEDROCK** - OpenAI-compatible endpoint (Recommended)
2. **AWS Credentials** - IAM credentials from environment variables
3. **AWS Credential Chain** - IAM roles, profiles, etc.

## Files Modified

### 1. `/app/api/settings/route.ts`
- Added `AWS_BEARER_TOKEN_BEDROCK` to GET response
- Added bearer token handling in POST request
- Updated credential source detection
- Updated .env file generation with bearer token option

### 2. `/components/app-sidebar.tsx`
- Added `AWS_BEARER_TOKEN_BEDROCK` to state
- Added bearer token input field in General tab
- Organized AWS credentials into two options:
  - Option 1: OpenAI-Compatible Endpoint (Bearer Token)
  - Option 2: AWS SDK with IAM Credentials
- Added visual separator between options

### 3. `/app/api/bedrock/models/route.ts`
- Implemented priority-based authentication
- Added bearer token check first (Priority 1)
- Falls back to AWS SDK credentials (Priority 2)
- Uses OpenAI-compatible endpoint when bearer token is available
- Updated error messages to suggest both authentication methods

### 4. `/app/api/health/route.ts`
- Updated `checkBedrock()` to check bearer token first
- Falls back to AWS SDK credentials
- Updated health check messages to indicate authentication method used
- Improved error messages for troubleshooting

### 5. `/app/api/chat/route.ts`
- Updated `createBedrockProvider()` with priority-based authentication
- Uses `createOpenAICompatible` when bearer token is available
- Falls back to `createAmazonBedrock` for IAM credentials
- Updated error handling to suggest both authentication methods

### 6. `/README.md`
- Updated Environment Variables section
- Updated AWS Bedrock setup instructions
- Added authentication priority documentation
- Clarified two authentication options

### 7. `/.env.example` (New File)
- Created example environment file
- Documented both authentication methods
- Added helpful comments

## Usage

### Option 1: Bearer Token (Recommended)
```bash
# In .env.local or UI Settings
AWS_BEARER_TOKEN_BEDROCK=your_bearer_token_here
AWS_REGION=us-east-1
```

### Option 2: IAM Credentials
```bash
# In .env.local or UI Settings
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

## Testing Checklist
- [ ] Bearer token authentication works for model listing
- [ ] Bearer token authentication works for chat
- [ ] Bearer token authentication works for health check
- [ ] Falls back to IAM credentials when bearer token not set
- [ ] UI displays bearer token input field
- [ ] Settings save bearer token to .env file
- [ ] Error messages guide users to correct authentication method
- [ ] Health check shows correct authentication method in use

## API Endpoints Used

### With Bearer Token
- **Base URL**: `https://bedrock-runtime.{region}.amazonaws.com/openai/v1`
- **Authentication**: `Authorization: Bearer {token}`
- **Models Endpoint**: `/models`
- **Chat Endpoint**: `/chat/completions`

### With IAM Credentials
- **SDK**: `@aws-sdk/client-bedrock`
- **Methods**: 
  - `ListInferenceProfilesCommand`
  - `ListFoundationModelsCommand`
  - `InvokeModel` (via AI SDK)

## Benefits
1. **Simpler Setup**: Bearer token is easier to configure than IAM credentials
2. **OpenAI Compatible**: Uses standard OpenAI API format
3. **Flexible**: Supports both authentication methods
4. **Backward Compatible**: Existing IAM credential setup continues to work
5. **Priority-Based**: Automatically selects best available authentication method
