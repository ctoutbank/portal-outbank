import { getNameByTenant, getThemeByTenant } from "@/lib/cache/theme-cache";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password/reset-password-form";

export const dynamic = 'force-dynamic';

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  
  const cookieStore = await cookies();
  let tenant = cookieStore.get("tenant")?.value;

  const devTenant = process.env.DEV_TENANT;
  
  if (devTenant && (!tenant || tenant === "0")) {
    tenant = devTenant;
  }

  const nameTenant = tenant ? await getNameByTenant(tenant) : null;
  const themeData = tenant ? await getThemeByTenant(tenant) : null;

  if (!themeData || !nameTenant) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:block w-2/3 relative overflow-hidden bg-[#0a0a0a]">
          <Image
            src="/bg_login.jpeg"
            alt="Ilustração de autenticação"
            fill
            className="object-cover z-0"
            priority
            sizes="66vw"
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/3 lg:px-12 xl:px-16 bg-[#0a0a0a]">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-white mb-2">Consolle</h1>
              <p className="text-[#808080] text-sm">Redefinir Senha</p>
            </div>
            <ResetPasswordForm token={token} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:block w-2/3 relative overflow-hidden"
        style={{
          background: `linear-gradient(to right, hsl(${themeData.primary}), hsl(${themeData.secondary}))`,
        }}
      >
        {themeData.loginImageUrl && (
          <Image
            src={`${themeData.loginImageUrl}${themeData.loginImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
            alt="Ilustração de autenticação"
            fill
            className="object-cover z-0"
            priority
            sizes="66vw"
            unoptimized={themeData.loginImageUrl.includes('.s3.')}
          />
        )}
      </div>

      <div
        className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/3 lg:px-12 xl:px-16"
        style={{
          background: `hsl(${themeData.primary})`,
        }}
      >
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <div className="relative p-2 rounded-lg bg-black/30 backdrop-blur-sm shadow-xl">
                <div
                  className="w-32 h-20"
                  style={{
                    backgroundImage: `url(${themeData.imageUrl}${themeData.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    borderRadius: 16,
                  }}
                  aria-label={`Logo ${nameTenant.slug}`}
                />
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex justify-center mb-8">
            <div
              className="w-32 h-20"
              style={{
                backgroundImage: `url(${themeData.imageUrl}${themeData.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                borderRadius: 16,
              }}
              aria-label={`Logo ${nameTenant.slug}`}
            />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-light text-white mb-2">
              Redefinir Senha
            </h1>
            <p className="text-gray-300/80 text-sm">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
