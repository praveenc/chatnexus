import { NextResponse } from 'next/server';
import {
  BedrockClient,
  ListInferenceProfilesCommand,
  InferenceProfileType,
  type ListInferenceProfilesCommandInput,
} from '@aws-sdk/client-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

interface InferenceProfileModel {
  modelArn?: string;
  modelName?: string;
}

interface InferenceProfileSummary {
  inferenceProfileId?: string;
  inferenceProfileName?: string;
  status?: string;
  type?: string;
  description?: string;
  models?: InferenceProfileModel[];
  createdAt?: Date;
  lastUpdatedAt?: Date;
}

/**
 * GET /api/bedrock/models
 * Fetches available Bedrock models by querying inference profiles
 * Credentials are inferred from environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 * or from AWS credential chain (IAM roles, instance profiles, etc.)
 */
export async function GET() {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';

    // Initialize Bedrock client with flexible credential loading
    const bedrockClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? new BedrockClient({
          region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
          },
        })
      : new BedrockClient({
          region,
          credentials: fromNodeProviderChain(),
        });

    let allProfiles: InferenceProfileSummary[] = [];
    let nextToken: string | undefined;

    // Paginate through all inference profiles
    do {
      const listProfilesInput: ListInferenceProfilesCommandInput = {
        maxResults: 100,
        typeEquals: InferenceProfileType.SYSTEM_DEFINED,
        nextToken,
      };

      const command = new ListInferenceProfilesCommand(listProfilesInput);
      const response = await bedrockClient.send(command);

      allProfiles = allProfiles.concat(response.inferenceProfileSummaries || []);
      nextToken = response.nextToken;
    } while (nextToken);

    console.log(`Bedrock: Found ${allProfiles.length} total inference profiles`);

    // Filter out embedding and image models
    const filteredProfiles = allProfiles.filter((profile: InferenceProfileSummary) => {
      if (!profile.models || profile.models.length === 0) {
        return false;
      }

      const modelArn = profile.models[0].modelArn || '';

      // Exclude embedding models and image models
      if (
        modelArn.toLowerCase().includes('embed') ||
        modelArn.toLowerCase().includes('stable-image') ||
        modelArn.toLowerCase().includes('twelvelabs')
      ) {
        return false;
      }

      return true;
    });

    // Map to our model format
    const mappedModels = filteredProfiles.map((profile: InferenceProfileSummary) => {
      const displayName = profile.inferenceProfileName || profile.inferenceProfileId || '';
      const modelId = profile.inferenceProfileId || '';

      return {
        key: modelId,
        name: displayName,
        size: 'Cloud',
        architecture: 'Amazon Bedrock',
        provider: 'bedrock',
      };
    });

    // Remove duplicates
    const uniqueModels = Array.from(
      new Map(mappedModels.map((model) => [model.key, model])).values()
    );

    // Sort models: Anthropic/Claude first, then alphabetically
    uniqueModels.sort((a, b) => {
      const aIsAnthropic = a.name.toLowerCase().includes('anthropic') || a.name.toLowerCase().includes('claude');
      const bIsAnthropic = b.name.toLowerCase().includes('anthropic') || b.name.toLowerCase().includes('claude');

      if (aIsAnthropic && !bIsAnthropic) return -1;
      if (!aIsAnthropic && bIsAnthropic) return 1;

      return a.name.localeCompare(b.name);
    });

    console.log(`Bedrock: Returning ${uniqueModels.length} unique models`);

    return NextResponse.json({
      models: uniqueModels,
      count: uniqueModels.length,
    });
  } catch (error) {
    console.error('Bedrock: Failed to list models:', error);
    const err = error as Error;

    let errorMessage = 'Failed to list Bedrock models';
    let statusCode = 500;

    // Handle specific AWS errors
    if (
      err.name === 'CredentialsProviderError' ||
      err.message?.includes('CredentialsProviderError') ||
      err.message?.includes('Could not load credentials')
    ) {
      errorMessage = 'AWS credentials not found. Please configure AWS credentials in your environment.';
      statusCode = 401;
    } else if (err.name === 'AccessDeniedException' || err.message?.includes('Access Denied')) {
      errorMessage = 'Access denied to Amazon Bedrock. Check IAM permissions (bedrock:ListInferenceProfiles required).';
      statusCode = 403;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        errorType: err.name,
        errorDetail: err.message,
        models: [],
        count: 0,
      },
      { status: statusCode }
    );
  }
}
