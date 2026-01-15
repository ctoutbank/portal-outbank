"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerForm from "./customer-form";
import { CustomerSchema } from "../schema/schema";
import { CustomizationSchema } from "../schema/customizationSchema";
import UserCustomerForm from "../users/_components/user-form";
import UsersCustomerList from "../users/_components/user-table-updated";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ProfileDD,
  UserDetailForm,
  getUserDetail,
  UserDetail,
  getUsersByCustomerId,
} from "../users/_actions/user-actions";
import {
  saveCustomization,
  updateCustomization,
  removeImage,
  removeAllImages,
  type CustomerCustomization,
} from "@/utils/serverActions";
import Image from "next/image";
import { Info, Palette, Building2, Users, Save, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipProvider,
} from "@radix-ui/react-tooltip";
import { TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { generateSlug } from "@/lib/utils";
import { insertCustomerFormAction } from "../_actions/customers-formActions";
import { updateCustomer } from "../server/customers";
import imageCompression from "browser-image-compression";

interface CustomerWizardFormProps {
  customer: CustomerSchema;
  profiles: ProfileDD[];
  permissions?: string[];
  activeTabDefault?: string;
  customizationInitial?: CustomerCustomization | null;
}

export default function CustomerWizardForm({
  customer,
  profiles,
  activeTabDefault = "step1",
  customizationInitial = null,
}: CustomerWizardFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newCustomerId, setNewCustomerId] = useState<number | null>(
    customer.id || null
  );
  const [isFirstStepComplete, setIsFirstStepComplete] = useState(!!customer.id);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof getUsersByCustomerId>>>([]);
  const [isLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserDetailForm | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [customizationData, setCustomizationData] = useState<{
    imageUrl?: string;
    id: number;
    subdomain?: string;
    primaryColor?: string;
    secondaryColor?: string;
    loginButtonColor?: string;
    loginButtonTextColor?: string;
    loginTitleColor?: string;
    loginTextColor?: string;
    loginImageUrl?: string;
    faviconUrl?: string;
    emailImageUrl?: string;
    menuIconUrl?: string;
  } | null>(
    customizationInitial ? {
      imageUrl: customizationInitial.imageUrl ?? undefined,
      id: customizationInitial.id ?? 0,
      subdomain: customizationInitial.slug ?? undefined,
      primaryColor: customizationInitial.primaryColor ?? undefined,
      secondaryColor: customizationInitial.secondaryColor ?? undefined,
      loginButtonColor: customizationInitial.loginButtonColor ?? undefined,
      loginButtonTextColor: customizationInitial.loginButtonTextColor ?? undefined,
      loginTitleColor: customizationInitial.loginTitleColor ?? undefined,
      loginTextColor: customizationInitial.loginTextColor ?? undefined,
      loginImageUrl: customizationInitial.loginImageUrl ?? undefined,
      faviconUrl: customizationInitial.faviconUrl ?? undefined,
      emailImageUrl: customizationInitial.emailImageUrl ?? undefined,
      menuIconUrl: customizationInitial.menuIconUrl ?? undefined,
    } : null
  );

  // Estados para controlar quais seções estão abertas
  // Na edição (quando customer.id existe), todas as seções devem iniciar recolhidas (false)
  // Na criação (sem ID), apenas a seção 1 deve iniciar aberta
  const [section1Open, setSection1Open] = useState<boolean>(() => !customer.id);
  const [section2Open, setSection2Open] = useState<boolean>(false);
  const [section3Open, setSection3Open] = useState<boolean>(false);

  // Atualizar seção 3 quando isFirstStepComplete mudar (apenas para criação)
  useEffect(() => {
    // Apenas abre automaticamente na criação, não na edição
    if (isFirstStepComplete && !customer.id) {
      setSection3Open(true);
    }
  }, [isFirstStepComplete, customer.id]);

  function hslToHex(hsl: string): string {
    if (!hsl) return "#000000";
    // Se já é HEX, retornar como está
    if (hsl.startsWith('#')) return hsl;

    try {
      const parts = hsl.trim().split(/\s+/);
      if (parts.length !== 3) return "#000000";

      const h = parseFloat(parts[0]) / 360; // Converter de graus (0-360) para escala 0-1
      const s = parseFloat(parts[1]) / 100; // Converter de porcentagem para escala 0-1
      const l = parseFloat(parts[2]) / 100; // Converter de porcentagem para escala 0-1

      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h * 12) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };

      return `#${f(0)}${f(8)}${f(4)}`;
    } catch {
      return "#000000";
    }
  }

  // ✅ Função para comprimir imagem antes do upload
  async function compressImage(file: File, maxSizeMB: number = 0.8): Promise<File> {
    try {
      // Se o arquivo já está abaixo do limite, não comprimir
      if (file.size <= maxSizeMB * 1024 * 1024) {
        return file;
      }

      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);

      // Converter Blob para File mantendo o nome original
      return new File([compressedFile], file.name, {
        type: compressedFile.type || file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      // Se a compressão falhar, retornar o arquivo original
      return file;
    }
  }

  // ✅ Função para adicionar cache busting agressivo nas URLs (timestamp único)
  function addCacheBustingToUrl(url: string | null | undefined): string {
    if (!url) return url || '';
    // ✅ Se for URL assinada (S3/CloudFront), não adicionar parâmetros extras pois quebra a assinatura
    if (url.includes('X-Amz-Signature') || url.includes('Signature=') || url.includes('GoogleAccessId')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    // Usar timestamp + nanoid para garantir unicidade total
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return `${url}${separator}v=${uniqueId}`;
  }

  // ✅ Função para atualizar favicon no DOM instantaneamente
  function updateFaviconInDOM(url: string | null | undefined) {
    if (typeof window === 'undefined') return;
    if (!url) return;

    const newUrl = addCacheBustingToUrl(url);
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;

    if (favicon) {
      favicon.href = newUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = newUrl;
      document.head.appendChild(link);
    }

    // Forçar reload do favicon em alguns navegadores
    const link2 = document.createElement('link');
    link2.rel = 'icon';
    link2.href = newUrl;
    link2.setAttribute('data-favicon-update', Date.now().toString());
    document.head.appendChild(link2);
    setTimeout(() => {
      const oldFavicon = document.querySelector('link[rel="icon"]:not([data-favicon-update])');
      if (oldFavicon) {
        oldFavicon.remove();
      }
    }, 100);
  }

  // ✅ Função para atualizar cores CSS variables no DOM instantaneamente (otimizada)
  function updateColorsInDOM(primaryHsl: string | null | undefined, secondaryHsl: string | null | undefined) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const html = document.documentElement;
    const body = document.body;

    if (primaryHsl) {
      const primaryHex = hslToHex(primaryHsl);
      // Atualizar múltiplos seletores com !important via style
      root.style.setProperty('--tenant-primary', primaryHex, 'important');
      html.style.setProperty('--tenant-primary', primaryHex, 'important');
      if (body) body.style.setProperty('--tenant-primary', primaryHex, 'important');
    }

    if (secondaryHsl) {
      const secondaryHex = hslToHex(secondaryHsl);
      root.style.setProperty('--tenant-secondary', secondaryHex, 'important');
      html.style.setProperty('--tenant-secondary', secondaryHex, 'important');
      if (body) body.style.setProperty('--tenant-secondary', secondaryHex, 'important');
    }

    // Disparar evento customizado para componentes React
    window.dispatchEvent(new CustomEvent('theme-updated', {
      detail: { primary: primaryHsl, secondary: secondaryHsl }
    }));
  }

  // ✅ Função para atualizar imagens de background no DOM (login image) - otimizada
  function updateBackgroundImageInDOM(url: string | null | undefined) {
    if (typeof window === 'undefined') return;
    if (!url) return;

    const newUrl = addCacheBustingToUrl(url);
    const body = document.body;
    const html = document.documentElement;
    const rootBox = document.querySelector('.clerk-rootBox') as HTMLElement;

    // Atualizar body
    if (body) {
      body.style.backgroundImage = `url('${newUrl}')`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundAttachment = 'fixed';
    }

    // Atualizar html
    if (html) {
      html.style.backgroundImage = `url('${newUrl}')`;
      html.style.backgroundSize = 'cover';
      html.style.backgroundPosition = 'center';
    }

    // Atualizar Clerk rootBox se existir
    if (rootBox) {
      rootBox.style.backgroundImage = `url('${newUrl}')`;
      rootBox.style.backgroundSize = 'cover';
      rootBox.style.backgroundPosition = 'center';
    }

    // Forçar reload da imagem via JavaScript
    const img = new window.Image();
    img.src = newUrl;
    img.onload = () => {
      console.log('[updateBackgroundImageInDOM] ✅ Login image loaded successfully');
    };
  }

  // ✅ Função para atualizar logo no DOM (todas as ocorrências)
  function updateLogoInDOM(url: string | null | undefined) {
    if (typeof window === 'undefined') return;
    if (!url) return;

    const newUrl = addCacheBustingToUrl(url);

    // Atualizar todas as imagens com logo
    const logoImages = document.querySelectorAll('img[src*="logo"], img[alt*="logo"], img[alt*="Logo"]');
    logoImages.forEach((img) => {
      (img as HTMLImageElement).src = newUrl;
    });

    // Atualizar backgroundImage que usa logo
    const logoBackgrounds = document.querySelectorAll('[style*="background-image"][style*="logo"]');
    logoBackgrounds.forEach((el) => {
      (el as HTMLElement).style.backgroundImage = `url('${newUrl}')`;
    });

    // Forçar reload da imagem via JavaScript
    const img = new window.Image();
    img.src = newUrl;
    img.onload = () => {
      console.log('[updateLogoInDOM] ✅ Logo loaded successfully');
    };
  }

  // ✅ Função para atualizar email image no DOM
  function updateEmailImageInDOM(url: string | null | undefined) {
    if (typeof window === 'undefined') return;
    if (!url) return;

    const newUrl = addCacheBustingToUrl(url);

    // Atualizar imagens de email (se houver elementos específicos)
    const emailImages = document.querySelectorAll('img[src*="email"], img[alt*="email"], img[alt*="Email"]');
    emailImages.forEach((img) => {
      (img as HTMLImageElement).src = newUrl;
    });

    // Forçar reload da imagem via JavaScript
    const img = new window.Image();
    img.src = newUrl;
    img.onload = () => {
      console.log('[updateEmailImageInDOM] ✅ Email image loaded successfully');
    };
  }

  // Função para salvar todas as seções em sequência

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [loginImagePreview, setLoginImagePreview] = useState<string | null>(null);
  const [loginImageError, setLoginImageError] = useState<string | null>(null);
  const [loginImageFileName, setLoginImageFileName] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [faviconFileName, setFaviconFileName] = useState<string>("");
  const [emailImagePreview, setEmailImagePreview] = useState<string | null>(null);
  const [emailImageError, setEmailImageError] = useState<string | null>(null);
  const [emailImageFileName, setEmailImageFileName] = useState<string>("");
  const [menuIconPreview, setMenuIconPreview] = useState<string | null>(null);
  const [menuIconError, setMenuIconError] = useState<string | null>(null);
  const [menuIconFileName, setMenuIconFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  // Estados para modais de confirmação
  const [confirmRemoveImageOpen, setConfirmRemoveImageOpen] = useState(false);
  const [confirmRemoveAllImagesOpen, setConfirmRemoveAllImagesOpen] = useState(false);
  const [pendingRemoveImageType, setPendingRemoveImageType] = useState<'logo' | 'login' | 'favicon' | 'email' | 'menuIcon' | null>(null);

  // ✅ Estado controlado para cores (atualização instantânea)
  const [primaryColorHex, setPrimaryColorHex] = useState<string>(
    customizationData?.primaryColor
      ? hslToHex(customizationData.primaryColor)
      : "#000000"
  );
  const [secondaryColorHex, setSecondaryColorHex] = useState<string>(
    customizationData?.secondaryColor
      ? hslToHex(customizationData.secondaryColor)
      : "#ffffff"
  );

  // Estados para cores da página de login
  const [loginButtonColorHex, setLoginButtonColorHex] = useState<string>(
    customizationData?.loginButtonColor
      ? hslToHex(customizationData.loginButtonColor)
      : "#3b82f6"
  );
  const [loginButtonTextColorHex, setLoginButtonTextColorHex] = useState<string>(
    customizationData?.loginButtonTextColor
      ? hslToHex(customizationData.loginButtonTextColor)
      : "#ffffff"
  );
  const [loginTitleColorHex, setLoginTitleColorHex] = useState<string>(
    customizationData?.loginTitleColor
      ? hslToHex(customizationData.loginTitleColor)
      : "#ffffff"
  );
  const [loginTextColorHex, setLoginTextColorHex] = useState<string>(
    customizationData?.loginTextColor
      ? hslToHex(customizationData.loginTextColor)
      : "#d1d5db"
  );

  // ✅ Sincronizar cores hex quando customizationData mudar
  useEffect(() => {
    if (customizationData?.primaryColor) {
      setPrimaryColorHex(hslToHex(customizationData.primaryColor));
    }
    if (customizationData?.secondaryColor) {
      setSecondaryColorHex(hslToHex(customizationData.secondaryColor));
    }
    if (customizationData?.loginButtonColor) {
      setLoginButtonColorHex(hslToHex(customizationData.loginButtonColor));
    }
    if (customizationData?.loginButtonTextColor) {
      setLoginButtonTextColorHex(hslToHex(customizationData.loginButtonTextColor));
    }
    if (customizationData?.loginTitleColor) {
      setLoginTitleColorHex(hslToHex(customizationData.loginTitleColor));
    }
    if (customizationData?.loginTextColor) {
      setLoginTextColorHex(hslToHex(customizationData.loginTextColor));
    }
  }, [customizationData?.primaryColor, customizationData?.secondaryColor, customizationData?.loginButtonColor, customizationData?.loginButtonTextColor, customizationData?.loginTitleColor, customizationData?.loginTextColor]);

  // Função helper para converter HEX para HSL (reutilizável)
  const hexToHslForUpdate = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
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
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    if (customizationData?.imageUrl && !imageFileName) {
      const filename = customizationData.imageUrl.split('/').pop() || 'logo atual';
      setImageFileName(filename);
    }
    if (customizationData?.loginImageUrl && !loginImageFileName) {
      const filename = customizationData.loginImageUrl.split('/').pop() || 'imagem de login atual';
      setLoginImageFileName(filename);
    }
    if (customizationData?.faviconUrl && !faviconFileName) {
      const filename = customizationData.faviconUrl.split('/').pop() || 'favicon atual';
      setFaviconFileName(filename);
    }
  }, [customizationData, imageFileName, loginImageFileName, faviconFileName]);

  // ✅ useEffect para atualizar DOM automaticamente quando customizationData mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Atualizar favicon
    if (customizationData?.faviconUrl) {
      updateFaviconInDOM(customizationData.faviconUrl);
    }

    // Atualizar cores
    updateColorsInDOM(
      customizationData?.primaryColor ?? undefined,
      customizationData?.secondaryColor ?? undefined
    );

    // Atualizar background image
    if (customizationData?.loginImageUrl) {
      updateBackgroundImageInDOM(customizationData.loginImageUrl);
    }
  }, [customizationData?.faviconUrl, customizationData?.primaryColor, customizationData?.secondaryColor, customizationData?.loginImageUrl]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setImageError('❌ Por favor, selecione uma imagem válida');
        e.target.value = "";
        return;
      }

      setImageFileName(file.name);

      const MAX_SIZE = 3 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setImageError(`❌ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 3MB`);
        setImagePreview(null);
        e.target.value = "";
        setImageFileName("");
        return;
      }

      try {
        // ✅ Comprimir imagem se necessário (máximo 0.8MB)
        const compressedFile = await compressImage(file, 0.8);

        // Atualizar o input com o arquivo comprimido
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        e.target.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImagePreview(result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        setImageError('❌ Erro ao processar imagem. Tente novamente.');
        e.target.value = "";
        setImageFileName("");
      }
    } else {
      setImagePreview(null);
      setImageFileName("");
    }
  };

  const handleLoginImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLoginImageError(null);

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setLoginImageError('❌ Por favor, selecione uma imagem válida');
        e.target.value = "";
        return;
      }

      setLoginImageFileName(file.name);

      const MAX_SIZE = 3 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setLoginImageError(`❌ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 3MB`);
        setLoginImagePreview(null);
        e.target.value = "";
        setLoginImageFileName("");
        return;
      }

      try {
        // ✅ Comprimir imagem se necessário (máximo 0.8MB)
        const compressedFile = await compressImage(file, 0.8);

        // Atualizar o input com o arquivo comprimido
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        e.target.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setLoginImagePreview(result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar imagem de login:', error);
        setLoginImageError('❌ Erro ao processar imagem. Tente novamente.');
        e.target.value = "";
        setLoginImageFileName("");
      }
    } else {
      setLoginImagePreview(null);
      setLoginImageFileName("");
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFaviconError(null);

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setFaviconError('❌ Por favor, selecione uma imagem válida');
        e.target.value = "";
        return;
      }

      setFaviconFileName(file.name);

      const MAX_SIZE = 3 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setFaviconError(`❌ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 3MB`);
        setFaviconPreview(null);
        e.target.value = "";
        setFaviconFileName("");
        return;
      }

      try {
        // ✅ Comprimir imagem se necessário (máximo 0.5MB para favicon)
        const compressedFile = await compressImage(file, 0.5);

        // Atualizar o input com o arquivo comprimido
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        e.target.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setFaviconPreview(result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar favicon:', error);
        setFaviconError('❌ Erro ao processar imagem. Tente novamente.');
        e.target.value = "";
        setFaviconFileName("");
      }
    } else {
      setFaviconPreview(null);
      setFaviconFileName("");
    }
  };

  const handleEmailImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setEmailImageError(null);

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setEmailImageError('❌ Por favor, selecione uma imagem válida');
        e.target.value = "";
        return;
      }

      setEmailImageFileName(file.name);

      const MAX_SIZE = 3 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setEmailImageError(`❌ Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 3MB`);
        setEmailImagePreview(null);
        e.target.value = "";
        setEmailImageFileName("");
        return;
      }

      try {
        // ✅ Comprimir imagem se necessário (máximo 0.8MB)
        const compressedFile = await compressImage(file, 0.8);

        // Atualizar o input com o arquivo comprimido
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        e.target.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setEmailImagePreview(result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar logo de email:', error);
        setEmailImageError('❌ Erro ao processar imagem. Tente novamente.');
        e.target.value = "";
        setEmailImageFileName("");
      }
    } else {
      setEmailImagePreview(null);
      setEmailImageFileName("");
    }
  };

  const handleMenuIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setMenuIconError(null);

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMenuIconError('❌ Por favor, selecione uma imagem válida');
        e.target.value = "";
        return;
      }

      setMenuIconFileName(file.name);

      const MAX_SIZE = 500 * 1024; // 500KB
      if (file.size > MAX_SIZE) {
        setMenuIconError(`❌ Arquivo muito grande (${(file.size / 1024).toFixed(0)}KB). Máximo permitido: 500KB`);
        setMenuIconPreview(null);
        e.target.value = "";
        setMenuIconFileName("");
        return;
      }

      try {
        // ✅ Comprimir imagem se necessário (máximo 100KB)
        const compressedFile = await compressImage(file, 0.1);

        // Atualizar o input com o arquivo comprimido
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        e.target.files = dataTransfer.files;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setMenuIconPreview(result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Erro ao processar ícone do menu:', error);
        setMenuIconError('❌ Erro ao processar imagem. Tente novamente.');
        e.target.value = "";
        setMenuIconFileName("");
      }
    } else {
      setMenuIconPreview(null);
      setMenuIconFileName("");
    }
  };

  const handleFirstStepComplete = async (id: number) => {
    if (iso.subdomain && iso.subdomain.trim() !== "") {
      try {
        const formData = new FormData();
        formData.append("customerId", id.toString());
        formData.append("subdomain", iso.subdomain);
        formData.append("primaryColor", "#000000");
        formData.append("secondaryColor", "#ffffff");
        formData.append("loginButtonColor", "#3b82f6");
        formData.append("loginButtonTextColor", "#ffffff");
        formData.append("loginTitleColor", "#ffffff");
        formData.append("loginTextColor", "#d1d5db");

        if (customizationData?.id) {
          formData.append("id", customizationData.id.toString());
          await updateCustomization(formData);
        } else {
          await saveCustomization(formData);
        }

        router.refresh();
      } catch (error) {
        console.error("Erro ao salvar subdomain:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao salvar subdomain";
        toast.error(errorMessage);
      }
    }

    setNewCustomerId(id);
    setIsFirstStepComplete(true);
    loadUsers(id);
  };

  // Função para recarregar a lista de usuários
  const loadUsers = async (customerId: number) => {
    try {
      const users = await getUsersByCustomerId(customerId);
      setUsers(users);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsers([]);
    }
  };

  const handleRemoveImageRequest = (type: 'logo' | 'login' | 'favicon' | 'email' | 'menuIcon') => {
    if (!newCustomerId) {
      toast.error("ID do cliente não encontrado");
      return;
    }
    setPendingRemoveImageType(type);
    setConfirmRemoveImageOpen(true);
  };

  const handleRemoveImageConfirm = async () => {
    if (!newCustomerId || !pendingRemoveImageType) {
      return;
    }

    const type = pendingRemoveImageType;
    setIsRemovingImage(true);
    try {
      const result = await removeImage({ customerId: newCustomerId, type });

      if (result.success && result.customization) {
        setCustomizationData({
          imageUrl: result.customization.imageUrl ?? undefined,
          id: result.customization.id ?? 0,
          subdomain: result.customization.slug ?? undefined,
          primaryColor: result.customization.primaryColor ?? undefined,
          secondaryColor: result.customization.secondaryColor ?? undefined,
          loginImageUrl: result.customization.loginImageUrl ?? undefined,
          faviconUrl: result.customization.faviconUrl ?? undefined,
          emailImageUrl: result.customization.emailImageUrl ?? undefined,
          menuIconUrl: result.customization.menuIconUrl ?? undefined,
        });

        if (type === 'logo') {
          setImagePreview(null);
          setImageFileName("");
          const fileInput = document.getElementById('image') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } else if (type === 'login') {
          setLoginImagePreview(null);
          setLoginImageFileName("");
          const fileInput = document.getElementById('loginImage') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } else if (type === 'favicon') {
          setFaviconPreview(null);
          setFaviconFileName("");
          const fileInput = document.getElementById('favicon') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } else if (type === 'email') {
          setEmailImagePreview(null);
          setEmailImageFileName("");
          const fileInput = document.getElementById('emailImage') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        } else if (type === 'menuIcon') {
          setMenuIconPreview(null);
          setMenuIconFileName("");
          const fileInput = document.getElementById('menuIcon') as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        }

        toast.success("Imagem removida com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover imagem");
    } finally {
      setIsRemovingImage(false);
      setPendingRemoveImageType(null);
    }
  };

  const handleRemoveAllImagesRequest = () => {
    if (!newCustomerId) {
      toast.error("ID do cliente não encontrado");
      return;
    }
    setConfirmRemoveAllImagesOpen(true);
  };

  const handleRemoveAllImagesConfirm = async () => {
    if (!newCustomerId) {
      return;
    }

    setIsRemovingImage(true);
    try {
      const result = await removeAllImages({ customerId: newCustomerId });

      if (result.success && result.customization) {
        setCustomizationData({
          imageUrl: result.customization.imageUrl ?? undefined,
          id: result.customization.id ?? 0,
          subdomain: result.customization.slug ?? undefined,
          primaryColor: result.customization.primaryColor ?? undefined,
          secondaryColor: result.customization.secondaryColor ?? undefined,
          loginImageUrl: result.customization.loginImageUrl ?? undefined,
          faviconUrl: result.customization.faviconUrl ?? undefined,
          emailImageUrl: result.customization.emailImageUrl ?? undefined,
          menuIconUrl: result.customization.menuIconUrl ?? undefined,
        });

        // Limpar todos os previews e inputs
        setImagePreview(null);
        setImageFileName("");
        setLoginImagePreview(null);
        setLoginImageFileName("");
        setFaviconPreview(null);
        setFaviconFileName("");
        setEmailImagePreview(null);
        setEmailImageFileName("");
        setMenuIconPreview(null);
        setMenuIconFileName("");

        const imageInput = document.getElementById('image') as HTMLInputElement;
        const loginImageInput = document.getElementById('loginImage') as HTMLInputElement;
        const faviconInput = document.getElementById('favicon') as HTMLInputElement;
        const emailImageInput = document.getElementById('emailImage') as HTMLInputElement;
        const menuIconInput = document.getElementById('menuIcon') as HTMLInputElement;
        if (imageInput) imageInput.value = "";
        if (loginImageInput) loginImageInput.value = "";
        if (faviconInput) faviconInput.value = "";
        if (emailImageInput) emailImageInput.value = "";
        if (menuIconInput) menuIconInput.value = "";

        toast.success("Todas as imagens foram removidas com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao remover todas as imagens:", error);
      toast.error("Erro ao remover todas as imagens");
    } finally {
      setIsRemovingImage(false);
    }
  };

  useEffect(() => {
    if (newCustomerId) {
      loadUsers(newCustomerId);
    }
  }, [newCustomerId]);

  useEffect(() => {
    if (isFirstStepComplete && newCustomerId) {
      loadUsers(newCustomerId);
    }
  }, [isFirstStepComplete, newCustomerId]);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (selectedUser) {
        setIsLoadingUser(true);
        try {
          const userDetail = await getUserDetail(selectedUser);
          if (userDetail) {
            setUserToEdit(userDetail);
          } else {
            toast.error("Não foi possível carregar os detalhes do usuário");
            setSelectedUser(null);
          }
        } catch (error) {
          console.error("Erro ao carregar usuário:", error);
          toast.error("Erro ao carregar os detalhes do usuário");
          setSelectedUser(null);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setUserToEdit(null);
      }
    };

    fetchUserDetail();
  }, [selectedUser]);

  const handleUserSuccess = () => {
    if (newCustomerId) {
      loadUsers(newCustomerId);
    }
    setSelectedUser(null);
    setUserToEdit(null);
  };

  console.log("CUSTOMERID", newCustomerId);

  const [iso, setIso] = useState<{
    name: string;
    subdomain: string;
  }>({
    name: customer?.name || "",
    subdomain: "",
  });

  const handleSaveAll = async () => {
    setIsLoading(true);
    setIsSavingCustomization(true);
    const errors: string[] = [];
    const successes: string[] = [];
    let currentCustomerId = newCustomerId || customer?.id;
    let isNewCreation = !customer?.id && !newCustomerId;

    try {
      // 1. Salvar/Atualizar Informações Básicas do Cliente
      if (iso.name) {
        try {
          if (currentCustomerId) {
            // Atualizar cliente existente
            const updatedData = {
              id: currentCustomerId,
              name: iso.name,
              slug: customer?.slug || "",
              customerId: customer?.customerId ?? "",
              settlementManagementType: customer?.settlementManagementType ?? "",
            };
            await updateCustomer(updatedData);
            successes.push("Informações básicas atualizadas");
          } else {
            // Criar novo cliente
            const slug = generateSlug();
            const customerDataFixed = {
              slug: slug || "",
              name: iso.name,
              customerId: undefined,
              settlementManagementType: undefined,
              idParent: customer?.idParent || undefined,
              id: undefined,
            };
            const newId = await insertCustomerFormAction(customerDataFixed);
            if (newId !== null && newId !== undefined) {
              currentCustomerId = newId;
              setNewCustomerId(newId);
              setIsFirstStepComplete(true);
              successes.push("ISO criado com sucesso");
              // O redirecionamento será feito no final para não interromper o fluxo de personalização
            } else {
              throw new Error("Falha ao obter ID do novo cliente");
            }
          }
        } catch (error) {
          errors.push("Erro ao salvar informações básicas");
          console.error("Erro ao salvar informações básicas:", error);
        }
      }

      // 2. Salvar Personalização (se o cliente já existir ou acabou de ser criado)
      if (currentCustomerId) {
        try {
          const subdomain = (iso.subdomain || customizationData?.subdomain || "").trim();

          // Se não tiver subdomain nem cores alteradas nem arquivos, podemos pular
          // Mas como é um "Salvar Tudo", vamos tentar salvar o que estiver nos inputs

          const formData = new FormData();
          formData.set("customerId", String(currentCustomerId));

          // Sempre enviar o subdomain se disponível
          if (subdomain) {
            formData.set("subdomain", subdomain);
          } else if (isNewCreation && !subdomain) {
            // Se for novo e não tiver subdomínio, talvez devêssemos usar o slug ou algo assim
            // Por enquanto, se não tem, não envia e deixa o server action lidar
          }

          formData.set("primaryColor", primaryColorHex);
          formData.set("secondaryColor", secondaryColorHex);
          formData.set("loginButtonColor", loginButtonColorHex || "#3b82f6");
          formData.set("loginButtonTextColor", loginButtonTextColorHex || "#ffffff");
          formData.set("loginTitleColor", loginTitleColorHex || "#ffffff");
          formData.set("loginTextColor", loginTextColorHex || "#d1d5db");

          if (customizationData?.id) {
            formData.set("id", String(customizationData.id));
          }

          // Capturar arquivos do DOM
          const imageInput = document.getElementById('image') as HTMLInputElement;
          const loginImageInput = document.getElementById('loginImage') as HTMLInputElement;
          const faviconInput = document.getElementById('favicon') as HTMLInputElement;
          const emailImageInput = document.getElementById('emailImage') as HTMLInputElement;
          const menuIconInput = document.getElementById('menuIcon') as HTMLInputElement;

          if (imageInput?.files?.[0]) formData.append("image", imageInput.files[0]);
          if (loginImageInput?.files?.[0]) formData.append("loginImage", loginImageInput.files[0]);
          if (faviconInput?.files?.[0]) formData.append("favicon", faviconInput.files[0]);
          if (emailImageInput?.files?.[0]) formData.append("emailImage", emailImageInput.files[0]);
          if (menuIconInput?.files?.[0]) formData.append("menuIcon", menuIconInput.files[0]);

          // Validação básica se houver subdomínio
          if (subdomain || customizationData?.id) {
            const result = customizationData?.id
              ? await updateCustomization(formData)
              : await saveCustomization(formData);

            if (result?.customization) {
              setCustomizationData({
                imageUrl: result.customization.imageUrl ?? undefined,
                id: result.customization.id ?? 0,
                subdomain: result.customization.slug ?? undefined,
                primaryColor: result.customization.primaryColor ?? undefined,
                secondaryColor: result.customization.secondaryColor ?? undefined,
                loginImageUrl: result.customization.loginImageUrl ?? undefined,
                faviconUrl: result.customization.faviconUrl ?? undefined,
                emailImageUrl: result.customization.emailImageUrl ?? undefined,
                menuIconUrl: result.customization.menuIconUrl ?? undefined,
              });

              // Atualizar previews e DOM
              if (result.customization.primaryColor) setPrimaryColorHex(hslToHex(result.customization.primaryColor));
              if (result.customization.secondaryColor) setSecondaryColorHex(hslToHex(result.customization.secondaryColor));

              if (result.customization.faviconUrl) updateFaviconInDOM(result.customization.faviconUrl);
              if (result.customization.imageUrl) updateLogoInDOM(result.customization.imageUrl);
              if (result.customization.loginImageUrl) updateBackgroundImageInDOM(result.customization.loginImageUrl);
              if (result.customization.emailImageUrl) updateEmailImageInDOM(result.customization.emailImageUrl);

              updateColorsInDOM(
                result.customization.primaryColor ?? undefined,
                result.customization.secondaryColor ?? undefined
              );

              // Limpar estados locais de preview e inputs
              setImagePreview(null);
              setLoginImagePreview(null);
              setFaviconPreview(null);
              setEmailImagePreview(null);
              setMenuIconPreview(null);

              [imageInput, loginImageInput, faviconInput, emailImageInput, menuIconInput].forEach(input => {
                if (input) input.value = '';
              });

              successes.push("Personalização salva");
            }
          }
        } catch (error) {
          errors.push("Erro ao salvar personalização");
          console.error("Erro ao salvar personalização:", error);
        }
      }

      // 3. Mostrar resultados consolidados
      if (successes.length > 0 && errors.length === 0) {
        toast.success(`Tudo salvo com sucesso! ${successes.join(", ")}`);

        // Se foi uma criação, redirecionar para a página do novo cliente
        if (isNewCreation && currentCustomerId) {
          router.push(`/customers/${currentCustomerId}`);
        } else {
          router.refresh();
        }
      } else if (successes.length > 0 && errors.length > 0) {
        toast.warning(`${successes.join(", ")}. ${errors.join(", ")}`);
        router.refresh();
      } else if (errors.length > 0) {
        toast.error(errors.join(", "));
      }

    } catch (error) {
      console.error("Erro ao salvar tudo:", error);
      toast.error("Ocorreu um erro ao salvar");
    } finally {
      setIsLoading(false);
      setIsSavingCustomization(false);
    }
  };
  useEffect(() => {
    const initialSubdomain = customizationData?.subdomain || "";
    const initialName = customer?.name || "";

    setIso({
      name: initialName,
      subdomain: initialSubdomain,
    });
  }, [customizationData?.subdomain, customer?.name]);

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        <div className="space-y-4">

          {/* Seção 1: Informações Básicas */}
          <Collapsible open={section1Open} onOpenChange={setSection1Open} className="border rounded-lg">
            <CollapsibleTrigger className="w-full px-6 py-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">Informações Básicas</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${section1Open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 pb-6">
              <Card className="border-0 shadow-none">
                <CardContent className="space-y-6 p-0">
                  <div className="space-y-4">
                    <CustomerForm
                      customer={customer}
                      onSuccess={handleFirstStepComplete}
                      hideWrapper={true}
                      nameValue={iso.name}
                      onNameChange={(name) => setIso({ ...iso, name })}
                      subdomainValue={iso.subdomain}
                      onSubdomainChange={(subdomain) => setIso({ ...iso, subdomain })}
                      showSubmitButton={false}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => handleSaveAll()}
                      disabled={isLoading}
                    >
                      {isLoading ? "Salvando..." : "Salvar e Continuar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible >

          {/* Seção 2: Personalização Visual */}
          < Collapsible open={section2Open && isFirstStepComplete
          } onOpenChange={(open) => isFirstStepComplete && setSection2Open(open)} className="border rounded-lg" >
            <CollapsibleTrigger
              className="w-full px-6 py-4 hover:bg-muted/50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFirstStepComplete}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isFirstStepComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <Palette className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">Personalização Visual</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${section2Open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 pb-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveAll(); // Chamamos handleSaveAll que lerá do form se necessário ou usará state
                }}
                className="space-y-6"
              >
                <Card className="border-1">
                  {isFirstStepComplete && (
                    <>
                      <CardContent>
                        {/* LINHA 1: CORES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                          {/* Cor Primária */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                            <label className="block text-sm font-medium text-white mb-4">
                              <div className="flex items-center gap-1">
                                <span>Cor Primária</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-white p-1"
                                    >
                                      <Info className="w-4 h-4 text-gray-400" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>
                                      A cor primária deve ser uma cor escura.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="relative w-[60px] h-12 rounded-md overflow-hidden border border-[#2a2a2a] cursor-pointer" style={{ backgroundColor: primaryColorHex }}>
                                <input
                                  type="color"
                                  name="primaryColor"
                                  value={primaryColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setPrimaryColorHex(hexColor);
                                    setCustomizationData(prev => ({
                                      ...prev,
                                      primaryColor: hexToHslForUpdate(hexColor),
                                      id: prev?.id ?? 0,
                                      subdomain: prev?.subdomain,
                                      secondaryColor: prev?.secondaryColor,
                                      imageUrl: prev?.imageUrl,
                                      loginImageUrl: prev?.loginImageUrl,
                                      faviconUrl: prev?.faviconUrl,
                                      emailImageUrl: prev?.emailImageUrl,
                                    }));
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                              <input
                                type="text"
                                value={primaryColorHex}
                                onChange={(e) => {
                                  const hexColor = e.target.value;
                                  setPrimaryColorHex(hexColor);
                                  if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                    setCustomizationData(prev => ({
                                      ...prev,
                                      primaryColor: hexToHslForUpdate(hexColor),
                                      id: prev?.id ?? 0,
                                      subdomain: prev?.subdomain,
                                      secondaryColor: prev?.secondaryColor,
                                      imageUrl: prev?.imageUrl,
                                      loginImageUrl: prev?.loginImageUrl,
                                      faviconUrl: prev?.faviconUrl,
                                      emailImageUrl: prev?.emailImageUrl,
                                    }));
                                  }
                                }}
                                className="flex-1 rounded-md border border-[#2a2a2a] h-12 px-4 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                placeholder="#000000"
                              />
                            </div>
                          </div>

                          {/* Cor Secundária */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                            <label className="block text-sm font-medium text-white mb-4">
                              Cor Secundária
                            </label>
                            <div className="flex items-center gap-3">
                              <div className="relative w-[60px] h-12 rounded-md overflow-hidden border border-[#2a2a2a] cursor-pointer" style={{ backgroundColor: secondaryColorHex }}>
                                <input
                                  type="color"
                                  name="secondaryColor"
                                  value={secondaryColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setSecondaryColorHex(hexColor);
                                    setCustomizationData(prev => ({
                                      ...prev,
                                      secondaryColor: hexToHslForUpdate(hexColor),
                                      id: prev?.id ?? 0,
                                      subdomain: prev?.subdomain,
                                      primaryColor: prev?.primaryColor,
                                      imageUrl: prev?.imageUrl,
                                      loginImageUrl: prev?.loginImageUrl,
                                      faviconUrl: prev?.faviconUrl,
                                      emailImageUrl: prev?.emailImageUrl,
                                    }));
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                              <input
                                type="text"
                                value={secondaryColorHex}
                                onChange={(e) => {
                                  const hexColor = e.target.value;
                                  setSecondaryColorHex(hexColor);
                                  if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                    setCustomizationData(prev => ({
                                      ...prev,
                                      secondaryColor: hexToHslForUpdate(hexColor),
                                      id: prev?.id ?? 0,
                                      subdomain: prev?.subdomain,
                                      primaryColor: prev?.primaryColor,
                                      imageUrl: prev?.imageUrl,
                                      loginImageUrl: prev?.loginImageUrl,
                                      faviconUrl: prev?.faviconUrl,
                                      emailImageUrl: prev?.emailImageUrl,
                                    }));
                                  }
                                }}
                                className="flex-1 rounded-md border border-[#2a2a2a] h-12 px-4 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        </div>

                        {/* LINHA 1.5: CORES DA PÁGINA DE LOGIN */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Cores da Página de Login
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Cor do Botão */}
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                              <label className="flex items-center gap-3 text-sm font-medium text-white mb-3">
                                Cor do Botão
                                <div className="relative w-6 h-6 rounded border border-[#2a2a2a] overflow-hidden cursor-pointer shadow-sm" style={{ backgroundColor: loginButtonColorHex }}>
                                  <input
                                    type="color"
                                    name="loginButtonColor"
                                    value={loginButtonColorHex}
                                    onChange={(e) => {
                                      const hexColor = e.target.value;
                                      setLoginButtonColorHex(hexColor);
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginButtonColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={loginButtonColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setLoginButtonColorHex(hexColor);
                                    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginButtonColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }
                                  }}
                                  className="w-full rounded-md border border-[#2a2a2a] h-10 px-3 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                  placeholder="#3b82f6"
                                />
                              </div>
                            </div>

                            {/* Cor do Texto do Botão */}
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                              <label className="flex items-center gap-3 text-sm font-medium text-white mb-3">
                                Texto do Botão
                                <div className="relative w-6 h-6 rounded border border-[#2a2a2a] overflow-hidden cursor-pointer shadow-sm" style={{ backgroundColor: loginButtonTextColorHex }}>
                                  <input
                                    type="color"
                                    name="loginButtonTextColor"
                                    value={loginButtonTextColorHex}
                                    onChange={(e) => {
                                      const hexColor = e.target.value;
                                      setLoginButtonTextColorHex(hexColor);
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginButtonTextColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={loginButtonTextColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setLoginButtonTextColorHex(hexColor);
                                    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginButtonTextColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }
                                  }}
                                  className="w-full rounded-md border border-[#2a2a2a] h-10 px-3 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>

                            {/* Cor do Título */}
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                              <label className="flex items-center gap-3 text-sm font-medium text-white mb-3">
                                Cor do Título
                                <div className="relative w-6 h-6 rounded border border-[#2a2a2a] overflow-hidden cursor-pointer shadow-sm" style={{ backgroundColor: loginTitleColorHex }}>
                                  <input
                                    type="color"
                                    name="loginTitleColor"
                                    value={loginTitleColorHex}
                                    onChange={(e) => {
                                      const hexColor = e.target.value;
                                      setLoginTitleColorHex(hexColor);
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginTitleColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={loginTitleColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setLoginTitleColorHex(hexColor);
                                    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginTitleColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }
                                  }}
                                  className="w-full rounded-md border border-[#2a2a2a] h-10 px-3 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>

                            {/* Cor do Texto */}
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                              <label className="flex items-center gap-3 text-sm font-medium text-white mb-3">
                                Cor do Texto
                                <div className="relative w-6 h-6 rounded border border-[#2a2a2a] overflow-hidden cursor-pointer shadow-sm" style={{ backgroundColor: loginTextColorHex }}>
                                  <input
                                    type="color"
                                    name="loginTextColor"
                                    value={loginTextColorHex}
                                    onChange={(e) => {
                                      const hexColor = e.target.value;
                                      setLoginTextColorHex(hexColor);
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginTextColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={loginTextColorHex}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setLoginTextColorHex(hexColor);
                                    if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                                      setCustomizationData(prev => ({
                                        ...prev,
                                        loginTextColor: hexToHslForUpdate(hexColor),
                                        id: prev?.id ?? 0,
                                      }));
                                    }
                                  }}
                                  className="w-full rounded-md border border-[#2a2a2a] h-10 px-3 text-sm text-white font-mono bg-[#1a1a1a] focus:border-[#3a3a3a] focus:outline-none"
                                  placeholder="#d1d5db"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* LINHA 2: 3 CARDS DE IMAGENS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                          {/* Card 1: Logotipo Principal */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                            <label className="text-sm font-medium text-white mb-1">
                              Imagem ou Logotipo
                            </label>
                            <p className="text-xs text-gray-400 mb-4">
                              SVG (preferencial), PNG ou JPG • Proporção 3:1 a 4:1 • 448×160px (2×) ou 672×240px (3×) • Máx. 100KB
                            </p>

                            <div className={`bg-[#1a1a1a] border-2 rounded-lg min-h-[180px] flex items-center justify-center mb-4 transition-colors ${(imagePreview || customizationData?.imageUrl) ? 'border-solid border-[#2a2a2a] p-3' : 'border-dashed border-[#2a2a2a]'}`}>
                              {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="max-w-full max-h-[180px] object-contain" />
                              ) : customizationData?.imageUrl ? (
                                <img src={addCacheBustingToUrl(customizationData.imageUrl)} alt="Logo atual" className="max-w-full max-h-[180px] object-contain" key={customizationData.imageUrl} />
                              ) : (
                                <div className="text-center text-[#606060]">
                                  <div className="text-5xl mb-2 opacity-50">🖼️</div>
                                  <div className="text-xs">Nenhuma imagem selecionada</div>
                                </div>
                              )}
                            </div>

                            {imageError && (
                              <p className="text-xs text-orange-600 font-medium mb-2">
                                {imageError}
                              </p>
                            )}

                            <div className="relative mb-3">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                                name="image"
                                id="image"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="image"
                                className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-10 px-4 text-white text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]"
                              >
                                <span>📁</span>
                                <span>Selecionar arquivo</span>
                              </label>
                            </div>

                            {imageFileName && (
                              <p className="text-xs text-green-600 font-medium mb-3">
                                ✓ Arquivo selecionado: {imageFileName}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImageRequest('logo')}
                              disabled={isRemovingImage || (!imagePreview && !customizationData?.imageUrl)}
                              className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                            >
                              <span>🗑️</span>
                              <span>{isRemovingImage ? "Removendo..." : "Remover logo"}</span>
                            </button>
                          </div>

                          {/* Card 2: Logo para Email e Relatórios */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                            <label className="text-sm font-medium text-white mb-1">
                              Logo para Email e Relatórios
                            </label>
                            <p className="text-xs text-gray-400 mb-4">
                              SVG (preferencial), PNG ou JPG • Recomendado: logo com fundo transparente ou versão adequada para fundo branco • Máx. 3MB
                            </p>

                            <div className={`bg-[#1a1a1a] border-2 rounded-lg min-h-[180px] flex items-center justify-center mb-4 transition-colors ${(emailImagePreview || customizationData?.emailImageUrl) ? 'border-solid border-[#2a2a2a] p-3' : 'border-dashed border-[#2a2a2a]'}`}>
                              {emailImagePreview ? (
                                <img src={emailImagePreview} alt="Preview" className="max-w-full max-h-[180px] object-contain" />
                              ) : customizationData?.emailImageUrl ? (
                                <img src={addCacheBustingToUrl(customizationData.emailImageUrl)} alt="Logo de email atual" className="max-w-full max-h-[180px] object-contain" key={customizationData.emailImageUrl} />
                              ) : (
                                <div className="text-center text-[#606060]">
                                  <div className="text-5xl mb-2 opacity-50">📧</div>
                                  <div className="text-xs">Nenhuma imagem selecionada</div>
                                </div>
                              )}
                            </div>

                            {emailImageError && (
                              <p className="text-xs text-orange-600 font-medium mb-2">
                                {emailImageError}
                              </p>
                            )}

                            <div className="relative mb-3">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                                name="emailImage"
                                id="emailImage"
                                onChange={handleEmailImageChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="emailImage"
                                className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-10 px-4 text-white text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]"
                              >
                                <span>📁</span>
                                <span>Selecionar arquivo</span>
                              </label>
                            </div>

                            {emailImageFileName && (
                              <p className="text-xs text-green-600 font-medium mb-3">
                                ✓ Arquivo selecionado: {emailImageFileName}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImageRequest('email')}
                              disabled={isRemovingImage || (!emailImagePreview && !customizationData?.emailImageUrl)}
                              className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                            >
                              <span>🗑️</span>
                              <span>{isRemovingImage ? "Removendo..." : "Remover logo de email"}</span>
                            </button>
                          </div>

                          {/* Card 3: Favicon */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                            <label className="text-sm font-medium text-white mb-1">
                              Favicon
                            </label>
                            <p className="text-xs text-gray-400 mb-4">
                              ICO ou PNG • 32×32px ou 16×16px • Quadrado • Máx. 100KB
                            </p>

                            <div className={`bg-[#1a1a1a] border-2 rounded-lg min-h-[120px] flex items-center justify-center mb-4 transition-colors ${(faviconPreview || customizationData?.faviconUrl) ? 'border-solid border-[#2a2a2a] p-3' : 'border-dashed border-[#2a2a2a]'}`}>
                              {faviconPreview ? (
                                <div className="flex gap-4 items-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <img src={faviconPreview} alt="Favicon 16x16" width={16} height={16} className="border border-[#2a2a2a]" />
                                    <span className="text-xs text-gray-400">16×16</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    <img src={faviconPreview} alt="Favicon 32x32" width={32} height={32} className="border border-[#2a2a2a]" />
                                    <span className="text-xs text-gray-400">32×32</span>
                                  </div>
                                </div>
                              ) : customizationData?.faviconUrl ? (
                                <div className="flex gap-4 items-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <img src={addCacheBustingToUrl(customizationData.faviconUrl)} alt="Favicon 16x16" width={16} height={16} className="border border-[#2a2a2a]" key={`${customizationData.faviconUrl}-16`} />
                                    <span className="text-xs text-gray-400">16×16</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    <img src={addCacheBustingToUrl(customizationData.faviconUrl)} alt="Favicon 32x32" width={32} height={32} className="border border-[#2a2a2a]" key={`${customizationData.faviconUrl}-32`} />
                                    <span className="text-xs text-gray-400">32×32</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-[#606060]">
                                  <div className="text-5xl mb-2 opacity-50">⭐</div>
                                  <div className="text-xs">Nenhum ícone selecionado</div>
                                </div>
                              )}
                            </div>

                            {faviconError && (
                              <p className="text-xs text-orange-600 font-medium mb-2">
                                {faviconError}
                              </p>
                            )}

                            <div className="relative mb-3">
                              <input
                                type="file"
                                accept="image/x-icon,image/vnd.microsoft.icon,image/ico,image/png"
                                name="favicon"
                                id="favicon"
                                onChange={handleFaviconChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="favicon"
                                className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-10 px-4 text-white text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]"
                              >
                                <span>📁</span>
                                <span>Selecionar arquivo</span>
                              </label>
                            </div>

                            {faviconFileName && (
                              <p className="text-xs text-green-600 font-medium mb-3">
                                ✓ Arquivo selecionado: {faviconFileName}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImageRequest('favicon')}
                              disabled={isRemovingImage || (!faviconPreview && !customizationData?.faviconUrl)}
                              className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                            >
                              <span>🗑️</span>
                              <span>{isRemovingImage ? "Removendo..." : "Remover favicon"}</span>
                            </button>
                          </div>
                        </div>

                        {/* LINHA 3: ÍCONE DO MENU E IMAGEM DE FUNDO DO LOGIN (Lado a Lado) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                          {/* ÍCONE DO MENU (36x36px) */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                            <label className="text-sm font-medium text-white mb-1">
                              Ícone do Menu (36×36px)
                            </label>
                            <p className="text-xs text-gray-400 mb-4">
                              PNG ou SVG • 36×36px • Fundo transparente recomendado • Máx. 500KB
                            </p>

                            <div className={`bg-[#1a1a1a] border-2 rounded-lg min-h-[120px] flex items-center justify-center mb-4 transition-colors ${(menuIconPreview || customizationData?.menuIconUrl) ? 'border-solid border-[#2a2a2a] p-3' : 'border-dashed border-[#2a2a2a]'}`}>
                              {menuIconPreview ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img src={menuIconPreview} alt="Preview ícone do menu" width={36} height={36} className="border border-[#2a2a2a]" />
                                  <span className="text-xs text-gray-400">36×36</span>
                                </div>
                              ) : customizationData?.menuIconUrl ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img src={addCacheBustingToUrl(customizationData.menuIconUrl)} alt="Ícone do menu atual" width={36} height={36} className="border border-[#2a2a2a]" key={customizationData.menuIconUrl} />
                                  <span className="text-xs text-gray-400">36×36</span>
                                </div>
                              ) : (
                                <div className="text-center text-[#606060]">
                                  <div className="text-4xl mb-2 opacity-50">🔲</div>
                                  <div className="text-xs">Nenhum ícone selecionado</div>
                                </div>
                              )}
                            </div>

                            {menuIconError && (
                              <p className="text-xs text-orange-600 font-medium mb-2">
                                {menuIconError}
                              </p>
                            )}

                            <div className="relative mb-3">
                              <input
                                type="file"
                                accept="image/png,image/svg+xml"
                                name="menuIcon"
                                id="menuIcon"
                                onChange={handleMenuIconChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="menuIcon"
                                className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-10 px-4 text-white text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]"
                              >
                                <span>📁</span>
                                <span>Selecionar arquivo</span>
                              </label>
                            </div>

                            {menuIconFileName && (
                              <p className="text-xs text-green-600 font-medium mb-3">
                                ✓ Arquivo selecionado: {menuIconFileName}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImageRequest('menuIcon')}
                              disabled={isRemovingImage || (!menuIconPreview && !customizationData?.menuIconUrl)}
                              className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                            >
                              <span>🗑️</span>
                              <span>{isRemovingImage ? "Removendo..." : "Remover ícone"}</span>
                            </button>
                          </div>

                          {/* IMAGEM DE FUNDO DO LOGIN */}
                          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                            <label className="text-sm font-medium text-white mb-1">
                              Imagem de Fundo do Login
                            </label>

                            <div className={`bg-[#1a1a1a] border-2 rounded-lg min-h-[180px] flex items-center justify-center mb-4 transition-colors overflow-hidden ${(loginImagePreview || customizationData?.loginImageUrl) ? 'border-solid border-[#2a2a2a] p-3' : 'border-dashed border-[#2a2a2a]'}`}>
                              {loginImagePreview ? (
                                <img src={loginImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                              ) : customizationData?.loginImageUrl ? (
                                <img src={addCacheBustingToUrl(customizationData.loginImageUrl)} alt="Imagem de fundo atual" className="w-full h-48 object-cover" key={customizationData.loginImageUrl} />
                              ) : (
                                <div className="text-center text-[#606060]">
                                  <div className="text-5xl mb-2 opacity-50">🖼️</div>
                                  <div className="text-xs">Nenhuma imagem selecionada</div>
                                </div>
                              )}
                            </div>

                            {loginImageError && (
                              <p className="text-xs text-orange-600 font-medium mb-2">
                                {loginImageError}
                              </p>
                            )}

                            <div className="relative mb-3">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                name="loginImage"
                                id="loginImage"
                                onChange={handleLoginImageChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="loginImage"
                                className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md h-10 px-4 text-white text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:border-[#3a3a3a]"
                              >
                                <span>📁</span>
                                <span>Selecionar arquivo</span>
                              </label>
                            </div>

                            {loginImageFileName && (
                              <p className="text-xs text-green-600 font-medium mb-3">
                                ✓ Arquivo selecionado: {loginImageFileName}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImageRequest('login')}
                              disabled={isRemovingImage || (!loginImagePreview && !customizationData?.loginImageUrl)}
                              className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                            >
                              <span>🗑️</span>
                              <span>{isRemovingImage ? "Removendo..." : "Remover imagem de login"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Botões do Rodapé: Remover Tudo (esquerda) e Salvar (direita) */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-[#1a1a1a] gap-4">
                          <div>
                            {(customizationData?.imageUrl || customizationData?.loginImageUrl || customizationData?.faviconUrl || customizationData?.emailImageUrl) && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500 hover:text-red-400 hover:bg-red-950/20"
                                onClick={handleRemoveAllImagesRequest}
                                disabled={isRemovingImage}
                              >
                                {isRemovingImage ? "Removendo..." : "Remover todas as imagens"}
                              </Button>
                            )}
                          </div>
                          <Button
                            type="submit"
                            className="min-w-[140px] cursor-pointer"
                            disabled={isSavingCustomization}
                          >
                            {isSavingCustomization
                              ? "Salvando..."
                              : "Salvar Personalização"}
                          </Button>
                        </div>

                        {/* Campos ocultos restaurados */}
                        {customizationData?.id && (
                          <input
                            type="hidden"
                            name="id"
                            value={customizationData.id}
                          />
                        )}
                        <input
                          type="hidden"
                          name="customerId"
                          value={newCustomerId || ""}
                        />
                        <input
                          type="hidden"
                          name="subdomain"
                          value={iso.subdomain || customizationData?.subdomain || ""}
                        />
                      </CardContent>
                    </>
                  )}
                </Card>
              </form>
              {!isFirstStepComplete && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Por favor, crie o ISO na seção "Informações Básicas" antes de personalizar.</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible >

          {/* Seção 3: Gestão de Usuários */}
          < Collapsible open={section3Open && isFirstStepComplete} onOpenChange={(open) => isFirstStepComplete && setSection3Open(open)} className="border rounded-lg" >
            <CollapsibleTrigger
              className="w-full px-6 py-4 hover:bg-muted/50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFirstStepComplete}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${isFirstStepComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">Gestão de Usuários</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${section3Open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 pb-6">
              {isFirstStepComplete ? (
                <div className="space-y-6">
                  {/* Tabela de Usuários */}
                  {selectedUser === null && (
                    <div className="space-y-4">
                      {isLoadingUsers ? (
                        <div className="text-center p-8">
                          <p>Carregando usuários...</p>
                        </div>
                      ) : (
                        <UsersCustomerList
                          users={users}
                          customerId={newCustomerId || 0}
                          customerName={customer.name || undefined}
                          onRefresh={() => loadUsers(newCustomerId || 0)}
                        />
                      )}
                    </div>
                  )}

                  {/* Modo de Edição de Usuário */}
                  {selectedUser !== null && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Editar Usuário</h3>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedUser(null)}
                          className="cursor-pointer"
                        >
                          Voltar
                        </Button>
                      </div>

                      {isLoadingUser ? (
                        <div className="text-center p-4">
                          <p>Carregando dados do usuário...</p>
                        </div>
                      ) : (
                        <UserCustomerForm
                          user={userToEdit || undefined}
                          customerId={newCustomerId || undefined}
                          onSuccess={handleUserSuccess}
                          profiles={profiles}
                          hideWrapper={true}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Por favor, crie o ISO na seção "Informações Básicas" antes de gerenciar usuários.</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible >
        </div >

        {/* Botão Salvar Tudo após todas as seções */}
        < div className="flex justify-end mt-6 pt-6 border-t" >
          <Button
            onClick={handleSaveAll}
            disabled={isLoading || isSavingCustomization}
            className="cursor-pointer min-w-[160px] bg-black hover:bg-gray-800 text-white"
            size="default"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Tudo"}
          </Button>
        </div >

        {/* Modal de confirmação para remover imagem individual */}
        < ConfirmDialog
          open={confirmRemoveImageOpen}
          onOpenChange={setConfirmRemoveImageOpen}
          title="Remover Imagem"
          description={
            pendingRemoveImageType === 'logo'
              ? "Tem certeza que deseja remover o logo?"
              : pendingRemoveImageType === 'login'
                ? "Tem certeza que deseja remover a imagem de fundo do login?"
                : pendingRemoveImageType === 'favicon'
                  ? "Tem certeza que deseja remover o favicon?"
                  : pendingRemoveImageType === 'menuIcon'
                    ? "Tem certeza que deseja remover o ícone do menu?"
                    : "Tem certeza que deseja remover a logo de email?"
          }
          confirmText="Remover"
          cancelText="Cancelar"
          onConfirm={handleRemoveImageConfirm}
          onCancel={() => setPendingRemoveImageType(null)}
        />

        {/* Modal de confirmação para remover todas as imagens */}
        <ConfirmDialog
          open={confirmRemoveAllImagesOpen}
          onOpenChange={setConfirmRemoveAllImagesOpen}
          title="Remover Todas as Imagens"
          description="Tem certeza que deseja remover TODAS as imagens? Esta ação removerá o logo, imagem de login, favicon e logo de email."
          confirmText="Remover Todas"
          cancelText="Cancelar"
          onConfirm={handleRemoveAllImagesConfirm}
        />
      </div>
    </TooltipProvider>
  );
}
