'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { CopyIcon, RefreshCcwIcon, Trash2Icon, AlertCircleIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DEFAULT_SETTINGS, type ProviderSettings, type ModelInfo } from '@/lib/providers';

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_SETTINGS);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelCount, setModelCount] = useState({ lmstudio: 0, ollama: 0, bedrock: 0 });
  const [providerError, setProviderError] = useState<string | null>(null);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all messages?')) {
      setMessages([]);
    }
  };

  // Load default provider from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('defaultProvider');
    if (savedProvider && (savedProvider === 'lmstudio' || savedProvider === 'ollama' || savedProvider === 'bedrock')) {
      setSettings(prev => ({
        ...prev,
        provider: savedProvider as ProviderSettings['provider'],
      }));
    }
  }, []);

  // Check provider health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`/api/health?provider=${settings.provider}`);
        const data = await response.json();

        if (!data.status) {
          setProviderError(data.message);
        } else {
          setProviderError(null);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setProviderError('Failed to check provider status');
      }
    };

    checkHealth();
  }, [settings.provider]);

  // Fetch available models based on selected provider
  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch(`/api/models?provider=${settings.provider}`);
        const data = await response.json();

        if (data.models && data.models.length > 0) {
          setModels(data.models);
          setModelCount(data.providers || { lmstudio: 0, ollama: 0, bedrock: 0 });

          // Set first model as default if current model is not in the list
          const currentModelExists = data.models.find((m: ModelInfo) => m.key === model);
          if (!currentModelExists && data.models.length > 0) {
            setModel(data.models[0].key);
          }
        } else {
          setModels([]);
          if (!model) {
            setModel('');
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setModels([]);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [settings.provider]); // Re-fetch when provider changes

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments) || !model) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          provider: settings.provider,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        },
      },
    );
    setInput('');
  };

  const currentModel = models.find(m => m.key === model);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        settings={settings}
        onSettingsChange={setSettings}
        modelCount={modelCount}
      />
      <SidebarInset>
        <div className="flex h-full flex-col">
          {/* Header with Sidebar Trigger */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger />
            <div className="flex-1 flex items-center justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-semibold mb-0.5 flex items-center gap-2">
                  {settings.provider === 'lmstudio' ? (
                    <>
                      <Image src="/lmstudio_icon.svg" alt="LM Studio" width={18} height={18} />
                      <span>LM Studio AI Chat</span>
                    </>
                  ) : settings.provider === 'ollama' ? (
                    <>
                      <Image src="/ollama_icon.svg" alt="Ollama" width={18} height={18} />
                      <span>Ollama AI Chat</span>
                    </>
                  ) : (
                    <>
                      <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={18} height={18} />
                      <span>AWS Bedrock AI Chat</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {modelsLoading ? (
                    'Loading models...'
                  ) : models.length > 0 ? (
                    `${models.length} model${models.length !== 1 ? 's' : ''} available`
                  ) : (
                    settings.provider === 'bedrock'
                      ? 'Checking AWS Bedrock access...'
                      : `No models found. Please start ${settings.provider === 'lmstudio' ? 'LM Studio' : 'Ollama'} and load a model.`
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentModel && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium">{currentModel.name}</p>
                    {currentModel.size && (
                      <p className="text-xs text-muted-foreground">
                        {currentModel.size}
                      </p>
                    )}
                  </div>
                )}
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChat}
                    className="gap-2"
                  >
                    <Trash2Icon className="size-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">

            {/* Provider Error Alert */}
            {providerError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Provider Connection Error</AlertTitle>
                <AlertDescription>
                  {providerError}
                  {settings.provider === 'bedrock' && (
                    <div className="mt-2">
                      <p className="text-xs">To configure AWS Bedrock:</p>
                      <ol className="text-xs list-decimal list-inside mt-1 space-y-0.5">
                        <li>Option 1: Use system credentials (IAM roles, AWS profiles)</li>
                        <li>Option 2: Set via Settings panel in sidebar</li>
                        <li>Option 3: Create <code className="bg-destructive/20 px-1 rounded">.env</code> file with credentials</li>
                        <li>Ensure IAM user has required Bedrock permissions</li>
                        <li>Request model access in AWS Bedrock console</li>
                      </ol>
                    </div>
                  )}
                  {settings.provider === 'lmstudio' && (
                    <div className="mt-2 text-xs">
                      <p>To start LM Studio:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-0.5">
                        <li>Open LM Studio application</li>
                        <li>Go to &ldquo;Local Server&rdquo; tab</li>
                        <li>Click &ldquo;Start Server&rdquo;</li>
                        <li>Load a model</li>
                      </ol>
                    </div>
                  )}
                  {settings.provider === 'ollama' && (
                    <div className="mt-2 text-xs">
                      <p>To start Ollama:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-0.5">
                        <li>Install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline">ollama.com</a></li>
                        <li>Run: <code className="bg-destructive/20 px-1 rounded">ollama pull llama3.2</code></li>
                        <li>Ollama server starts automatically</li>
                      </ol>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 && (
              <ConversationEmptyState
                title="Start a conversation"
                description={
                  models.length > 0
                    ? `Select a model and send a message to get started with ${
                        settings.provider === 'lmstudio' ? 'LM Studio' :
                        settings.provider === 'ollama' ? 'Ollama' :
                        'AWS Bedrock'
                      }`
                    : settings.provider === 'bedrock'
                    ? 'Configure AWS credentials or use system environment credentials to access Bedrock models'
                    : `Please start ${settings.provider === 'lmstudio' ? 'LM Studio' : 'Ollama'} and load a model to begin`
                }
                icon={
                  settings.provider === 'lmstudio' ? (
                    <Image src="/lmstudio_icon.svg" alt="LM Studio" width={80} height={80} />
                  ) : settings.provider === 'ollama' ? (
                    <Image src="/ollama_icon.svg" alt="Ollama" width={80} height={80} />
                  ) : (
                    <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={80} height={80} />
                  )
                }
              />
            )}
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  const isLastMessage = message.id === messages[messages.length - 1]?.id;

                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && (
                            <MessageActions>
                              {isLastMessage && (
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                              )}
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    case 'tool-call':
                      // Type guard for tool-call
                      if ('input' in part && typeof part.input === 'object' && part.input !== null) {
                        const toolInput = part.input as { query?: string };
                        return (
                          <div key={`${message.id}-${i}`} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
                            <SearchIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-muted-foreground mb-1">Searching the web</p>
                              <p className="text-sm truncate">{toolInput.query || 'Searching...'}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    case 'tool-result':
                      // Type guard for tool-result
                      if ('output' in part && part.output && typeof part.output === 'object') {
                        const toolOutput = part.output as { answer?: string; results?: Array<{ title: string; url: string; content: string; score: number }>; error?: string };
                        if (!toolOutput.error) {
                          return (
                            <div key={`${message.id}-${i}`} className="space-y-2">
                              {toolOutput.answer && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Search Result</p>
                                  <p className="text-sm text-blue-800 dark:text-blue-200">{toolOutput.answer}</p>
                                </div>
                              )}
                              {toolOutput.results && toolOutput.results.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground px-1">Sources:</p>
                                  {toolOutput.results.slice(0, 3).map((result, idx) => (
                                    <a
                                      key={idx}
                                      href={result.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 hover:bg-muted/50 rounded border text-xs group"
                                    >
                                      <p className="font-medium group-hover:text-primary truncate">{result.title}</p>
                                      <p className="text-muted-foreground text-xs truncate">{result.url}</p>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                      }
                      return null;
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

          <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder={models.length === 0 ? 'Please load a model first...' : 'Type your message...'}
                disabled={models.length === 0}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                  disabled={models.length === 0}
                >
                  <PromptInputSelectTrigger>
                    {currentModel ? (
                      <div className="flex items-center gap-2">
                        {currentModel.provider === 'lmstudio' ? (
                          <Image src="/lmstudio_icon.svg" alt="LM Studio" width={16} height={16} />
                        ) : currentModel.provider === 'ollama' ? (
                          <Image src="/ollama_icon.svg" alt="Ollama" width={16} height={16} />
                        ) : currentModel.provider === 'bedrock' ? (
                          <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={16} height={16} />
                        ) : (
                          <span className="text-base">☁️</span>
                        )}
                        <span>{currentModel.name}</span>
                      </div>
                    ) : (
                      <PromptInputSelectValue placeholder="Select a model..." />
                    )}
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {models.map((m) => {
                      return (
                        <PromptInputSelectItem key={m.key} value={m.key}>
                          <div className="flex items-center gap-2">
                            {m.provider === 'lmstudio' ? (
                              <Image src="/lmstudio_icon.svg" alt="LM Studio" width={16} height={16} />
                            ) : m.provider === 'ollama' ? (
                              <Image src="/ollama_icon.svg" alt="Ollama" width={16} height={16} />
                            ) : m.provider === 'bedrock' ? (
                              <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={16} height={16} />
                            ) : (
                              <span className="text-base">☁️</span>
                            )}
                            <span>{m.name} {m.size && `(${m.size})`}</span>
                          </div>
                        </PromptInputSelectItem>
                      );
                    })}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input || !model || models.length === 0}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ChatBotDemo;