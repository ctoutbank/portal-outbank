"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, Image as ImageIcon, Palette } from "lucide-react";
import Image from "next/image";

interface PortalSettings {
  id?: number;
  login_image_url?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  login_button_color?: string;
  login_button_text_color?: string;
  login_title_color?: string;
  login_text_color?: string;
}

function hslToHex(hsl: string | null | undefined): string {
  if (!hsl) return "#3b82f6";
  if (hsl.startsWith('#')) return hsl;
  
  try {
    const parts = hsl.trim().split(/\s+/);
    if (parts.length !== 3) return "#3b82f6";
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return "#3b82f6";
  }
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91 60";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)} ${Math.round(l * 100)}`;
}

export function DesignSettingsForm() {
  const [settings, setSettings] = useState<PortalSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const loginImageRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/portal-settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(file: File, type: string) {
    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/portal-settings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      const fieldMap: Record<string, keyof PortalSettings> = {
        loginImage: 'login_image_url',
        logo: 'logo_url',
        favicon: 'favicon_url',
      };

      setSettings(prev => ({
        ...prev,
        [fieldMap[type]]: data.url,
      }));

      toast.success('Imagem enviada com sucesso');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingType(null);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginImageUrl: settings.login_image_url,
          logoUrl: settings.logo_url,
          faviconUrl: settings.favicon_url,
          primaryColor: settings.primary_color,
          secondaryColor: settings.secondary_color,
          loginButtonColor: settings.login_button_color,
          loginButtonTextColor: settings.login_button_text_color,
          loginTitleColor: settings.login_title_color,
          loginTextColor: settings.login_text_color,
        }),
      });

      if (!response.ok) throw new Error('Save failed');

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }

  function handleColorChange(field: keyof PortalSettings, hexColor: string) {
    setSettings(prev => ({
      ...prev,
      [field]: hexToHsl(hexColor),
    }));
  }

  function clearImage(field: keyof PortalSettings) {
    setSettings(prev => ({
      ...prev,
      [field]: null,
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#212121] border border-[#2E2E2E] rounded-[6px]">
              <ImageIcon className="h-5 w-5 text-[#E0E0E0]" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-[#FFFFFF]">
                Imagens do Login
              </CardTitle>
              <CardDescription className="text-xs text-[#5C5C5C]">
                Configure as imagens exibidas na tela de login do Portal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm text-[#E0E0E0]">Imagem de Fundo (2/3 da tela)</Label>
            <div className="flex items-center gap-4">
              {settings.login_image_url ? (
                <div className="relative w-40 h-24 rounded-md overflow-hidden border border-[#2E2E2E]">
                  <Image
                    src={settings.login_image_url}
                    alt="Login background"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => clearImage('login_image_url')}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-500"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-24 rounded-md border border-dashed border-[#2E2E2E] flex items-center justify-center">
                  <span className="text-xs text-[#5C5C5C]">Sem imagem</span>
                </div>
              )}
              <input
                ref={loginImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'loginImage')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => loginImageRef.current?.click()}
                disabled={uploadingType === 'loginImage'}
                className="bg-[#212121] border-[#2E2E2E] hover:bg-[#2E2E2E]"
              >
                {uploadingType === 'loginImage' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-[#E0E0E0]">Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logo_url ? (
                <div className="relative w-24 h-24 rounded-md overflow-hidden border border-[#2E2E2E] bg-white flex items-center justify-center">
                  <Image
                    src={settings.logo_url}
                    alt="Logo"
                    fill
                    className="object-contain p-2"
                  />
                  <button
                    onClick={() => clearImage('logo_url')}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-500"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-md border border-dashed border-[#2E2E2E] flex items-center justify-center">
                  <span className="text-xs text-[#5C5C5C]">Sem logo</span>
                </div>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingType === 'logo'}
                className="bg-[#212121] border-[#2E2E2E] hover:bg-[#2E2E2E]"
              >
                {uploadingType === 'logo' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-[#E0E0E0]">Favicon</Label>
            <div className="flex items-center gap-4">
              {settings.favicon_url ? (
                <div className="relative w-16 h-16 rounded-md overflow-hidden border border-[#2E2E2E] bg-white flex items-center justify-center">
                  <Image
                    src={settings.favicon_url}
                    alt="Favicon"
                    fill
                    className="object-contain p-1"
                  />
                  <button
                    onClick={() => clearImage('favicon_url')}
                    className="absolute top-0 right-0 p-1 bg-red-500/80 rounded-full hover:bg-red-500"
                  >
                    <Trash2 className="h-2 w-2 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-md border border-dashed border-[#2E2E2E] flex items-center justify-center">
                  <span className="text-xs text-[#5C5C5C]">Sem</span>
                </div>
              )}
              <input
                ref={faviconRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'favicon')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => faviconRef.current?.click()}
                disabled={uploadingType === 'favicon'}
                className="bg-[#212121] border-[#2E2E2E] hover:bg-[#2E2E2E]"
              >
                {uploadingType === 'favicon' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#212121] border border-[#2E2E2E] rounded-[6px]">
              <Palette className="h-5 w-5 text-[#E0E0E0]" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-[#FFFFFF]">
                Cores do Login
              </CardTitle>
              <CardDescription className="text-xs text-[#5C5C5C]">
                Configure as cores exibidas na tela de login do Portal
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.primary_color)}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.primary_color)}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.secondary_color)}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.secondary_color)}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor do Botão</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.login_button_color)}
                  onChange={(e) => handleColorChange('login_button_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.login_button_color)}
                  onChange={(e) => handleColorChange('login_button_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor do Texto do Botão</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.login_button_text_color)}
                  onChange={(e) => handleColorChange('login_button_text_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.login_button_text_color)}
                  onChange={(e) => handleColorChange('login_button_text_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor do Título</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.login_title_color)}
                  onChange={(e) => handleColorChange('login_title_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.login_title_color)}
                  onChange={(e) => handleColorChange('login_title_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#E0E0E0]">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(settings.login_text_color)}
                  onChange={(e) => handleColorChange('login_text_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer bg-[#212121] border-[#2E2E2E]"
                />
                <Input
                  type="text"
                  value={hslToHex(settings.login_text_color)}
                  onChange={(e) => handleColorChange('login_text_color', e.target.value)}
                  className="flex-1 bg-[#212121] border-[#2E2E2E]"
                  placeholder="#9ca3af"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}
