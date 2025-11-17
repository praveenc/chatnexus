'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ThermometerIcon, HashIcon, ServerIcon, KeyIcon, SaveIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { PROVIDERS, type ProviderType, type ProviderSettings, type ModelCount } from '@/lib/providers';
import { toast } from 'sonner';

interface AppSidebarProps {
  settings: ProviderSettings;
  onSettingsChange: (settings: ProviderSettings) => void;
  modelCount?: ModelCount;
}

export function AppSidebar({
  settings,
  onSettingsChange,
  modelCount = { lmstudio: 0, ollama: 0, bedrock: 0 },
}: AppSidebarProps) {
  const [apiKeys, setApiKeys] = useState({
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_REGION: 'us-east-1',
    TAVILY_API_KEY: '',
  });
  const [saving, setSaving] = useState(false);

  // Load existing API keys on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        setApiKeys({
          AWS_ACCESS_KEY_ID: data.AWS_ACCESS_KEY_ID || '',
          AWS_SECRET_ACCESS_KEY: data.AWS_SECRET_ACCESS_KEY || '',
          AWS_REGION: data.AWS_REGION || 'us-east-1',
          TAVILY_API_KEY: data.TAVILY_API_KEY || '',
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleProviderChange = (provider: ProviderType) => {
    onSettingsChange({ ...settings, provider });
  };

  const handleTemperatureChange = (value: number[]) => {
    onSettingsChange({ ...settings, temperature: value[0] });
  };

  const handleMaxTokensChange = (value: number[]) => {
    onSettingsChange({ ...settings, maxTokens: value[0] });
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeys),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Settings Saved', {
          description: data.message,
        });
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to save settings',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1">
              <ServerIcon className="size-5 shrink-0" />
              <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">AI Provider</span>
                <span className="text-xs text-sidebar-foreground/70">
                  Local AI Configuration
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <Tabs defaultValue="model" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="model" className="text-xs">Model</TabsTrigger>
              <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            </TabsList>

            {/* Model Settings Tab */}
            <TabsContent value="model" className="space-y-4 mt-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Provider Selection</Label>
                <SidebarMenu>
                  {Object.values(PROVIDERS).map((provider) => {
                    const isActive = settings.provider === provider.id;
                    return (
                      <SidebarMenuItem key={provider.id}>
                        <SidebarMenuButton
                          onClick={() => handleProviderChange(provider.id)}
                          isActive={isActive}
                          className={`h-auto py-3 ${isActive ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                        >
                          {provider.id === 'lmstudio' ? (
                            <Image src="/lmstudio_icon.svg" alt="LM Studio" width={24} height={24} className="shrink-0" />
                          ) : provider.id === 'ollama' ? (
                            <Image src="/ollama_icon.svg" alt="Ollama" width={24} height={24} className="shrink-0" />
                          ) : provider.id === 'bedrock' ? (
                            <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={24} height={24} className="shrink-0" />
                          ) : (
                            <span className="text-2xl shrink-0">{provider.icon}</span>
                          )}
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className={`font-medium text-sm ${isActive ? 'text-primary' : ''}`}>
                              {provider.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {modelCount[provider.id]} model{modelCount[provider.id] !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>

              <SidebarSeparator />

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <ThermometerIcon className="size-3" />
                    Temperature
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.temperature?.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.temperature || 0.7]}
                  onValueChange={handleTemperatureChange}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher values make output more random
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <HashIcon className="size-3" />
                    Max Tokens
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {settings.maxTokens}
                  </span>
                </div>
                <Slider
                  value={[settings.maxTokens || 2000]}
                  onValueChange={handleMaxTokensChange}
                  min={100}
                  max={4000}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of response
                </p>
              </div>
            </TabsContent>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Default Provider Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Default Provider</Label>
                  <p className="text-xs text-muted-foreground">
                    Select which provider to use when the app starts
                  </p>
                  <div className="space-y-1">
                    {Object.values(PROVIDERS).map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          onSettingsChange({ ...settings, provider: provider.id });
                          localStorage.setItem('defaultProvider', provider.id);
                          toast.success('Default Provider Updated', {
                            description: `${provider.name} will be used on next launch`,
                          });
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border text-sm transition-colors ${
                          settings.provider === provider.id
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {provider.id === 'lmstudio' ? (
                          <Image src="/lmstudio_icon.svg" alt="LM Studio" width={20} height={20} />
                        ) : provider.id === 'ollama' ? (
                          <Image src="/ollama_icon.svg" alt="Ollama" width={20} height={20} />
                        ) : provider.id === 'bedrock' ? (
                          <Image src="/bedrock-color.svg" alt="AWS Bedrock" width={20} height={20} />
                        ) : (
                          <span className="text-lg">{provider.icon}</span>
                        )}
                        <span className="flex-1 text-left">{provider.name}</span>
                        {settings.provider === provider.id && (
                          <span className="text-xs text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <SidebarSeparator />

                <div className="flex items-center gap-2">
                  <KeyIcon className="size-4" />
                  <Label className="text-xs font-medium">API Keys</Label>
                </div>

                {/* AWS Credentials */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">AWS Bedrock</Label>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="AWS Access Key ID"
                      value={apiKeys.AWS_ACCESS_KEY_ID}
                      onChange={(e) => setApiKeys({ ...apiKeys, AWS_ACCESS_KEY_ID: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="password"
                      placeholder="AWS Secret Access Key"
                      value={apiKeys.AWS_SECRET_ACCESS_KEY}
                      onChange={(e) => setApiKeys({ ...apiKeys, AWS_SECRET_ACCESS_KEY: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="text"
                      placeholder="AWS Region (e.g., us-east-1)"
                      value={apiKeys.AWS_REGION}
                      onChange={(e) => setApiKeys({ ...apiKeys, AWS_REGION: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <SidebarSeparator />

                {/* Tavily API Key */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tavily Web Search</Label>
                  <Input
                    type="password"
                    placeholder="Tavily API Key"
                    value={apiKeys.TAVILY_API_KEY}
                    onChange={(e) => setApiKeys({ ...apiKeys, TAVILY_API_KEY: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your key from <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline">tavily.com</a>
                  </p>
                </div>

                <Button
                  onClick={handleSaveApiKeys}
                  disabled={saving}
                  className="w-full h-8 text-xs"
                  size="sm"
                >
                  <SaveIcon className="size-3 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Note: Restart the dev server after saving for changes to take effect.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-sidebar-foreground/70 space-y-1 group-data-[collapsible=icon]:hidden">
              <p className="font-medium">Connection:</p>
              <code className="block px-2 py-1 bg-sidebar-accent rounded text-xs break-all">
                {PROVIDERS[settings.provider].baseURL}
              </code>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
