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
  getUserDetailWithClerk,
  UserDetail,
  getUsersWithClerk,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@radix-ui/react-tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
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
  const [users, setUsers] = useState<UserDetail[]>([]);
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
    loginImageUrl?: string;
    faviconUrl?: string;
    emailImageUrl?: string;
  } | null>(
    customizationInitial ? {
      imageUrl: customizationInitial.imageUrl ?? undefined,
      id: customizationInitial.id ?? 0,
      subdomain: customizationInitial.slug ?? undefined,
      primaryColor: customizationInitial.primaryColor ?? undefined,
      secondaryColor: customizationInitial.secondaryColor ?? undefined,
      loginImageUrl: customizationInitial.loginImageUrl ?? undefined,
      faviconUrl: customizationInitial.faviconUrl ?? undefined,
      emailImageUrl: customizationInitial.emailImageUrl ?? undefined,
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
  const handleSaveAll = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    const successes: string[] = [];

    try {
      // 1. Salvar Informações Básicas
      if (iso.name && iso.subdomain) {
        try {
          const isEdit = Boolean(newCustomerId || customer?.id);
          if (isEdit && (newCustomerId || customer?.id)) {
            const updatedData = {
              id: newCustomerId || customer?.id,
              name: iso.name,
              slug: customer?.slug || "",
              customerId: customer?.customerId || "",
              settlementManagementType: customer?.settlementManagementType || "",
            };
            await updateCustomer(updatedData);
            successes.push("Informações básicas atualizadas");
            
            if (iso.subdomain && iso.subdomain.trim() !== "") {
              const formData = new FormData();
              const customerId = newCustomerId || customer?.id;
              if (customerId) {
                formData.append("customerId", customerId.toString());
                formData.append("subdomain", iso.subdomain);
                formData.append("primaryColor", primaryColorHex || "#000000");
                formData.append("secondaryColor", secondaryColorHex || "#ffffff");
              }
              
              if (customizationData?.id) {
                formData.append("id", customizationData.id.toString());
                await updateCustomization(formData);
              } else {
                await saveCustomization(formData);
              }
            }
          } else {
            const slug = generateSlug();
            const customerDataFixed = {
              slug: slug || "",
              name: iso.name,
              customerId: customer?.customerId || undefined,
              settlementManagementType: customer?.settlementManagementType || undefined,
              idParent: customer?.idParent || undefined,
              id: customer?.id || undefined,
            };
            const newId = await insertCustomerFormAction(customerDataFixed);
            if (newId !== null && newId !== undefined) {
              await handleFirstStepComplete(newId);
              successes.push("ISO criado com sucesso");
            }
          }
        } catch (error) {
          errors.push("Erro ao salvar informações básicas");
          console.error("Erro ao salvar informações básicas:", error);
        }
      }

      // 2. Salvar Personalização (se houver dados)
      if (isFirstStepComplete && (newCustomerId || customer?.id)) {
        try {
          const subdomain = (iso.subdomain || customizationData?.subdomain || "").trim();
          const customerId = newCustomerId || customer?.id;

          if (subdomain && customerId) {
            const formData = new FormData();
            formData.set("subdomain", subdomain);
            formData.set("customerId", String(customerId));
            formData.set("primaryColor", primaryColorHex);
            formData.set("secondaryColor", secondaryColorHex);
            if (customizationData?.id) {
              formData.set("id", String(customizationData.id));
            }

            // Capturar arquivos do formulário se existirem
            const imageInput = document.getElementById('image') as HTMLInputElement;
            const loginImageInput = document.getElementById('loginImage') as HTMLInputElement;
            const faviconInput = document.getElementById('favicon') as HTMLInputElement;
            const emailImageInput = document.getElementById('emailImage') as HTMLInputElement;

            if (imageInput?.files?.[0]) {
              formData.append("image", imageInput.files[0]);
            }
            if (loginImageInput?.files?.[0]) {
              formData.append("loginImage", loginImageInput.files[0]);
            }
            if (faviconInput?.files?.[0]) {
              formData.append("favicon", faviconInput.files[0]);
            }
            if (emailImageInput?.files?.[0]) {
              formData.append("emailImage", emailImageInput.files[0]);
            }

            const validationData = {
              subdomain: subdomain,
              primaryColor: primaryColorHex,
              secondaryColor: secondaryColorHex,
              image: formData.get("image"),
              customerId: String(customerId),
              id: customizationData?.id,
            };

            const validationResult = CustomizationSchema.safeParse(validationData);
            if (validationResult.success) {
              const result = customizationData 
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
                });

                if (result.customization.primaryColor) {
                  setPrimaryColorHex(hslToHex(result.customization.primaryColor));
                }
                if (result.customization.secondaryColor) {
                  setSecondaryColorHex(hslToHex(result.customization.secondaryColor));
                }

                // ✅ ATUALIZAÇÃO INSTANTÂNEA: Atualizar DOM imediatamente
                // 1. Atualizar favicon
                if (result.customization.faviconUrl) {
                  updateFaviconInDOM(result.customization.faviconUrl);
                }
                
                // 2. Atualizar logo
                if (result.customization.imageUrl) {
                  updateLogoInDOM(result.customization.imageUrl);
                }
                
                // 3. Atualizar cores CSS variables
                updateColorsInDOM(
                  result.customization.primaryColor ?? undefined,
                  result.customization.secondaryColor ?? undefined
                );
                
                // 4. Atualizar background image (login)
                if (result.customization.loginImageUrl) {
                  updateBackgroundImageInDOM(result.customization.loginImageUrl);
                }
                
                // 5. Atualizar email image
                if (result.customization.emailImageUrl) {
                  updateEmailImageInDOM(result.customization.emailImageUrl);
                }

                setImagePreview(null);
                setLoginImagePreview(null);
                setFaviconPreview(null);
                setEmailImagePreview(null);

                const fileInputs = [imageInput, loginImageInput, faviconInput, emailImageInput];
                fileInputs.forEach((input) => {
                  if (input) input.value = '';
                });

                successes.push("Personalização salva");
              }
            }
          }
        } catch (error) {
          errors.push("Erro ao salvar personalização");
          console.error("Erro ao salvar personalização:", error);
        }
      }

      // Mostrar resultados consolidados
      if (successes.length > 0 && errors.length === 0) {
        toast.success(`Tudo salvo com sucesso! ${successes.join(", ")}`);
      } else if (successes.length > 0 && errors.length > 0) {
        toast.warning(`${successes.join(", ")}. ${errors.join(", ")}`);
      } else if (errors.length > 0) {
        toast.error(errors.join(", "));
      }

      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar tudo:", error);
      toast.error("Ocorreu um erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  
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

  // ✅ Sincronizar cores hex quando customizationData mudar
  useEffect(() => {
    if (customizationData?.primaryColor) {
      setPrimaryColorHex(hslToHex(customizationData.primaryColor));
    }
    if (customizationData?.secondaryColor) {
      setSecondaryColorHex(hslToHex(customizationData.secondaryColor));
    }
  }, [customizationData?.primaryColor, customizationData?.secondaryColor]);

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

  const handleFirstStepComplete = async (id: number) => {
    if (iso.subdomain && iso.subdomain.trim() !== "") {
      try {
        const formData = new FormData();
        formData.append("customerId", id.toString());
        formData.append("subdomain", iso.subdomain);
        formData.append("primaryColor", "#000000");
        formData.append("secondaryColor", "#ffffff");
        
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
      const users = await getUsersWithClerk(customerId);
      setUsers(users);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsers([]);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'login' | 'favicon' | 'email') => {
    if (!newCustomerId) {
      toast.error("ID do cliente não encontrado");
      return;
    }

    const confirmMessage = type === 'logo' 
      ? "Tem certeza que deseja remover o logo?" 
      : type === 'login'
      ? "Tem certeza que deseja remover a imagem de fundo do login?"
      : type === 'favicon'
      ? "Tem certeza que deseja remover o favicon?"
      : "Tem certeza que deseja remover a logo de email?";

    if (!confirm(confirmMessage)) {
      return;
    }

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
        }

        toast.success("Imagem removida com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover imagem");
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleRemoveAllImages = async () => {
    if (!newCustomerId) {
      toast.error("ID do cliente não encontrado");
      return;
    }

    if (!confirm("Tem certeza que deseja remover TODAS as imagens? Esta ação removerá o logo, imagem de login e favicon.")) {
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
        });

        setImagePreview(null);
        setImageFileName("");
        setLoginImagePreview(null);
        setLoginImageFileName("");
        setFaviconPreview(null);
        setFaviconFileName("");

        const imageInput = document.getElementById('image') as HTMLInputElement;
        const loginImageInput = document.getElementById('loginImage') as HTMLInputElement;
        const faviconInput = document.getElementById('favicon') as HTMLInputElement;
        if (imageInput) imageInput.value = "";
        if (loginImageInput) loginImageInput.value = "";
        if (faviconInput) faviconInput.value = "";

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
          const userDetail = await getUserDetailWithClerk(selectedUser);
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

  useEffect(() => {
    const initialSubdomain = customizationData?.subdomain || "";
    const initialName = customer?.name || "";
    
    setIso({
      name: initialName,
      subdomain: initialSubdomain,
    });
  }, [customizationData?.subdomain, customer?.name]);

  return (
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
                    onClick={async () => {
                      const isEdit = Boolean(newCustomerId || customer?.id);
                      setIsLoading(true);
                      try {
                        if (isEdit && (newCustomerId || customer?.id)) {
                          const updatedData = {
                            id: newCustomerId || customer?.id,
                            name: iso.name,
                            slug: customer?.slug || "",
                            customerId: customer?.customerId || "",
                            settlementManagementType: customer?.settlementManagementType || "",
                          };
                          const updatedId = await updateCustomer(updatedData);
                          toast.success("ISO atualizado com sucesso");
                          
                          if (iso.subdomain && iso.subdomain.trim() !== "") {
                            const formData = new FormData();
                            formData.append("customerId", updatedId.toString());
                            formData.append("subdomain", iso.subdomain);
                            formData.append("primaryColor", primaryColorHex || "#000000");
                            formData.append("secondaryColor", secondaryColorHex || "#ffffff");
                            
                            if (customizationData?.id) {
                              formData.append("id", customizationData.id.toString());
                              await updateCustomization(formData);
                            } else {
                              await saveCustomization(formData);
                            }
                            
                            router.refresh();
                          }
                        } else {
                          const slug = generateSlug();
                          const customerDataFixed = {
                            slug: slug || "",
                            name: iso.name,
                            customerId: customer?.customerId || undefined,
                            settlementManagementType: customer?.settlementManagementType || undefined,
                            idParent: customer?.idParent || undefined,
                            id: customer?.id || undefined,
                          };
                          const newId = await insertCustomerFormAction(customerDataFixed);
                          toast.success("ISO criado com sucesso");
                          
                          if (newId !== null && newId !== undefined) {
                            await handleFirstStepComplete(newId);
                            router.replace(`/customers/${newId}`, { scroll: false });
                          }
                        }
                      } catch (error) {
                        console.error("Erro ao salvar ISO:", error);
                        toast.error("Ocorreu um erro ao processar a solicitação");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || !iso.name || !iso.subdomain}
                    className="cursor-pointer"
                  >
                    {isLoading ? "Salvando..." : (newCustomerId || customer?.id) ? "Salvar Informações Básicas" : "Salvar Informações Básicas"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Seção 2: Personalização Visual */}
        <Collapsible open={section2Open && isFirstStepComplete} onOpenChange={(open) => isFirstStepComplete && setSection2Open(open)} className="border rounded-lg">
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
            {isFirstStepComplete && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingCustomization(true);

                  // ✅ Capturar o formulário no início (antes do bloco assíncrono)
                  const form = e.currentTarget as HTMLFormElement;
                  const formData = new FormData(form);

                  const subdomain = (iso.subdomain || customizationData?.subdomain || "").trim();
                  const customerId = newCustomerId || customer?.id;

                  if (!subdomain) {
                    toast.error("Por favor, defina o Domínio do ISO no passo 1 antes de salvar a personalização");
                    setIsSavingCustomization(false);
                    return;
                  }

                  if (!customerId) {
                    toast.error("Por favor, crie o ISO no passo 1 antes de salvar a personalização");
                    setIsSavingCustomization(false);
                    return;
                  }

                  formData.set("subdomain", subdomain);
                  formData.set("customerId", String(customerId));
                  // ✅ Garantir que sempre envie HEX, não HSL
                  formData.set("primaryColor", primaryColorHex);
                  formData.set("secondaryColor", secondaryColorHex);
                  if (customizationData?.id) {
                    formData.set("id", String(customizationData.id));
                  }

                  const validationData = {
                    subdomain: subdomain,
                    primaryColor: primaryColorHex, // Usar valor HEX do estado
                    secondaryColor: secondaryColorHex, // Usar valor HEX do estado
                    image: formData.get("image"),
                    customerId: String(customerId),
                    id: customizationData?.id,
                  };

                  const validationResult =
                    CustomizationSchema.safeParse(validationData);

                  if (!validationResult.success) {
                    console.error("Validation errors:", validationResult.error.flatten());
                    toast.error("Por favor, corrija os erros antes de continuar");
                    setIsSavingCustomization(false);
                    return;
                  }

                  // ✅ ATUALIZAÇÃO OTIMISTA: assume sucesso e atualiza UI imediatamente
                  const primaryColorInput = formData.get("primaryColor") as string;
                  const secondaryColorInput = formData.get("secondaryColor") as string;
                  
                  // Atualizar previews otimisticamente
                  const optimisticUpdate = {
                    ...customizationData,
                    imageUrl: imagePreview || customizationData?.imageUrl,
                    loginImageUrl: loginImagePreview || customizationData?.loginImageUrl,
                    faviconUrl: faviconPreview || customizationData?.faviconUrl,
                    primaryColor: primaryColorInput ? hexToHslForUpdate(primaryColorInput) : customizationData?.primaryColor,
                    secondaryColor: secondaryColorInput ? hexToHslForUpdate(secondaryColorInput) : customizationData?.secondaryColor,
                    id: customizationData?.id ?? 0,
                    subdomain: customizationData?.subdomain,
                  };
                  
                  setCustomizationData(optimisticUpdate);
                  
                  // ✅ ATUALIZAÇÃO INSTANTÂNEA OTIMISTA: Atualizar DOM imediatamente antes de salvar
                  // Isso garante feedback visual instantâneo
                  if (faviconPreview || customizationData?.faviconUrl) {
                    updateFaviconInDOM(faviconPreview || customizationData?.faviconUrl);
                  }
                  
                  if (primaryColorInput || customizationData?.primaryColor) {
                    const primaryHsl = primaryColorInput ? hexToHslForUpdate(primaryColorInput) : customizationData?.primaryColor;
                    const secondaryHsl = secondaryColorInput ? hexToHslForUpdate(secondaryColorInput) : customizationData?.secondaryColor;
                    updateColorsInDOM(primaryHsl, secondaryHsl);
                  }
                  
                  if (loginImagePreview || customizationData?.loginImageUrl) {
                    updateBackgroundImageInDOM(loginImagePreview || customizationData?.loginImageUrl);
                  }

                  try {
                    // Timeout para evitar travamentos (30 segundos)
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error("Timeout: Operação demorou muito tempo. Tente novamente.")), 30000)
                    );

                    let result;
                    const savePromise = customizationData 
                      ? updateCustomization(formData)
                      : saveCustomization(formData);

                    // Race entre a operação de salvamento e o timeout
                    result = await Promise.race([savePromise, timeoutPromise]) as any;

                    if (result?.customization) {
                      // ✅ Atualizar com dados reais do servidor
                      setCustomizationData({
                        imageUrl: result.customization.imageUrl ?? undefined,
                        id: result.customization.id ?? 0,
                        subdomain: result.customization.slug ?? undefined,
                        primaryColor: result.customization.primaryColor ?? undefined,
                        secondaryColor: result.customization.secondaryColor ?? undefined,
                        loginImageUrl: result.customization.loginImageUrl ?? undefined,
                        faviconUrl: result.customization.faviconUrl ?? undefined,
                        emailImageUrl: result.customization.emailImageUrl ?? undefined,
                      });
                      
                      // ✅ Atualizar estados de cores hex
                      if (result.customization.primaryColor) {
                        setPrimaryColorHex(hslToHex(result.customization.primaryColor));
                      }
                      if (result.customization.secondaryColor) {
                        setSecondaryColorHex(hslToHex(result.customization.secondaryColor));
                      }
                      
                      // ✅ ATUALIZAÇÃO INSTANTÂNEA: Atualizar DOM imediatamente
                      // 1. Atualizar favicon
                      if (result.customization.faviconUrl) {
                        updateFaviconInDOM(result.customization.faviconUrl);
                      }
                      
                      // 2. Atualizar logo
                      if (result.customization.imageUrl) {
                        updateLogoInDOM(result.customization.imageUrl);
                      }
                      
                      // 3. Atualizar cores CSS variables
                      updateColorsInDOM(
                        result.customization.primaryColor ?? undefined,
                        result.customization.secondaryColor ?? undefined
                      );
                      
                      // 4. Atualizar background image (login)
                      if (result.customization.loginImageUrl) {
                        updateBackgroundImageInDOM(result.customization.loginImageUrl);
                      }
                      
                      // 5. Atualizar email image
                      if (result.customization.emailImageUrl) {
                        updateEmailImageInDOM(result.customization.emailImageUrl);
                      }
                      
                      // Limpar previews
                      setImagePreview(null);
                      setLoginImagePreview(null);
                      setFaviconPreview(null);
                      setEmailImagePreview(null);
                      
                      // ✅ Limpar inputs de arquivo (para permitir re-upload da mesma imagem)
                      // Usa a referência do formulário capturada no início
                      if (form) {
                        const fileInputs = form.querySelectorAll('input[type="file"]');
                        fileInputs.forEach((input) => {
                          (input as HTMLInputElement).value = '';
                        });
                      }
                      
                      if (result.customization.imageUrl) {
                        const filename = result.customization.imageUrl.split('/').pop() || 'logo atual';
                        setImageFileName(filename);
                      }
                      if (result.customization.loginImageUrl) {
                        const filename = result.customization.loginImageUrl.split('/').pop() || 'imagem de login atual';
                        setLoginImageFileName(filename);
                      }
                      if (result.customization.faviconUrl) {
                        const filename = result.customization.faviconUrl.split('/').pop() || 'favicon atual';
                        setFaviconFileName(filename);
                      }
                      if (result.customization.emailImageUrl) {
                        const filename = result.customization.emailImageUrl.split('/').pop() || 'logo de email atual';
                        setEmailImageFileName(filename);
                      }
                    }

                    toast.success("Customização salva com sucesso!");
                    
                    // NÃO faz router.refresh() para não sobrescrever atualizações otimistas
                    // O estado já foi atualizado acima e o DOM foi atualizado instantaneamente
                  } catch (error) {
                    console.error("Erro ao salvar a customização", error);
                    const errorMessage = error instanceof Error ? error.message : "Erro ao salvar a customização";
                    toast.error(errorMessage);
                    
                    // Reverte atualização otimista em caso de erro apenas se necessário
                    // Não faz router.refresh() para não perder o estado atual
                  } finally {
                    // Garante que o loading sempre seja resetado, mesmo em caso de erro
                    // Usa setTimeout para garantir que o estado seja atualizado
                    setTimeout(() => {
                      setIsSavingCustomization(false);
                    }, 100);
                  }
            }}
            className="space-y-6"
          >
            <Card className="border-1">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Palette className="h-5 w-5" />
                  Customização do ISO
                </CardTitle>
              </CardHeader>
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
                            <TooltipProvider>
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
                            </TooltipProvider>
                          </div>
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-[60px] h-12">
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
                              className="w-full h-full rounded-md border border-[#2a2a2a] cursor-pointer bg-transparent"
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
                          <div
                            className="w-[100px] h-12 rounded-md border border-[#2a2a2a] flex-shrink-0"
                            style={{ backgroundColor: primaryColorHex }}
                          />
                        </div>
                      </div>

                      {/* Cor Secundária */}
                      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5">
                        <label className="block text-sm font-medium text-white mb-4">
                          Cor Secundária
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-[60px] h-12">
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
                              className="w-full h-full rounded-md border border-[#2a2a2a] cursor-pointer bg-transparent"
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
                          <div
                            className="w-[100px] h-12 rounded-md border border-[#2a2a2a] flex-shrink-0"
                            style={{ backgroundColor: secondaryColorHex }}
                          />
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
                          onClick={() => handleRemoveImage('logo')}
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
                          onClick={() => handleRemoveImage('email')}
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
                          onClick={() => handleRemoveImage('favicon')}
                          disabled={isRemovingImage || (!faviconPreview && !customizationData?.faviconUrl)}
                          className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                        >
                          <span>🗑️</span>
                          <span>{isRemovingImage ? "Removendo..." : "Remover favicon"}</span>
                        </button>
                      </div>
                    </div>

                    {/* LINHA 3: IMAGEM DE FUNDO DO LOGIN */}
                    <div className="w-full md:w-1/3 mb-10">
                      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col">
                        <label className="text-sm font-medium text-white mb-1">
                          Imagem de Fundo do Login
                        </label>
                        <p className="text-xs text-gray-400 mb-4">
                          WebP (preferencial) ou JPG/PNG • 1600×1200px (4:3) ou 1920×1440px • Conteúdo centralizado • Máx. 3MB
                        </p>
                        
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
                          onClick={() => handleRemoveImage('login')}
                          disabled={isRemovingImage || (!loginImagePreview && !customizationData?.loginImageUrl)}
                          className="w-full bg-transparent border border-[#4a1a1a] rounded-md h-10 text-[#ff5555] text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#1a0a0a] hover:border-[#6a2a2a] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#2a2a2a] disabled:text-[#606060]"
                        >
                          <span>🗑️</span>
                          <span>{isRemovingImage ? "Removendo..." : "Remover imagem de login"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Botão Remover Todas as Imagens */}
                    {(customizationData?.imageUrl || customizationData?.loginImageUrl || customizationData?.faviconUrl || customizationData?.emailImageUrl) && (
                      <div className="mb-6">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                          onClick={handleRemoveAllImages}
                          disabled={isRemovingImage}
                        >
                          {isRemovingImage ? "Removendo..." : "Remover todas as imagens"}
                        </Button>
                      </div>
                    )}

                    {/* Campos ocultos */}
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
                <div className="flex justify-end space-x-2 mt-4 pr-3">
                  <Button
                    type="submit"
                    className="mt-6 p-2 cursor-pointer"
                    disabled={isSavingCustomization}
                  >
                    {isSavingCustomization
                      ? "Salvando..."
                      : "Salvar Personalização"}
                  </Button>
                </div>
              </Card>
            </form>
            )}
            {!isFirstStepComplete && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Por favor, crie o ISO na seção "Informações Básicas" antes de personalizar.</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Seção 3: Gestão de Usuários */}
        <Collapsible open={section3Open && isFirstStepComplete} onOpenChange={(open) => isFirstStepComplete && setSection3Open(open)} className="border rounded-lg">
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
                {/* Formulário de Criação de Usuário */}
                {selectedUser === null && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Criar Novo Usuário</h3>
                    <UserCustomerForm
                      customerId={newCustomerId || undefined}
                      onSuccess={handleUserSuccess}
                      profiles={profiles}
                      hideWrapper={true}
                    />
                  </div>
                )}

                {/* Tabela de Usuários */}
                {selectedUser === null && (
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Usuários Cadastrados</h3>
                    {isLoadingUsers ? (
                      <div className="text-center p-8">
                        <p>Carregando usuários...</p>
                      </div>
                    ) : (
                      <UsersCustomerList
                        users={users}
                        customerId={newCustomerId || 0}
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
        </Collapsible>
      </div>

      {/* Botão Salvar Tudo após todas as seções */}
      <div className="flex justify-end mt-6 pt-6 border-t">
        <Button
          onClick={handleSaveAll}
          disabled={isLoading || isSavingCustomization}
          className="cursor-pointer min-w-[160px] bg-black hover:bg-gray-800 text-white"
          size="default"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>
    </div>
  );
}
