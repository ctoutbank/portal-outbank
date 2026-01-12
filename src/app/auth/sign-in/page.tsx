import { getNameByTenant, getThemeByTenant } from "@/lib/cache/theme-cache";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { SignInForm } from "@/components/sign-in/sign-in-form";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPortalSettings, hslToHex } from "@/lib/portal-settings";

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const cookieStore = await cookies();
  let tenant = cookieStore.get("tenant")?.value;

  const devTenant = process.env.DEV_TENANT;

  if (devTenant && (!tenant || tenant === "0")) {
    tenant = devTenant;
  }

  const nameTenant = tenant ? await getNameByTenant(tenant) : null;
  const themeData = tenant ? await getThemeByTenant(tenant) : null;

  if (!themeData || !nameTenant) {
    const portalSettings = await getPortalSettings();

    const loginImageUrl = portalSettings?.login_image_url || "/bg_login.jpg";
    const logoUrl = portalSettings?.logo_url;
    const buttonColor = portalSettings?.login_button_color ? hslToHex(portalSettings.login_button_color) : "#3b82f6";
    const buttonTextColor = portalSettings?.login_button_text_color ? hslToHex(portalSettings.login_button_text_color) : "#ffffff";
    const titleColor = portalSettings?.login_title_color ? hslToHex(portalSettings.login_title_color) : "#ffffff";
    const textColor = portalSettings?.login_text_color ? hslToHex(portalSettings.login_text_color) : "#808080";

    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:block w-2/3 relative overflow-hidden bg-[#0a0a0a]">
          <Image
            src={loginImageUrl.startsWith('http') ? `${loginImageUrl}?t=${Date.now()}` : loginImageUrl}
            alt="Ilustração de autenticação"
            fill
            className="object-cover z-0"
            priority
            sizes="66vw"
            unoptimized={loginImageUrl.includes('.s3.')}
          />
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/3 lg:px-12 xl:px-16 bg-[#0a0a0a]">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
              {logoUrl ? (
                <div className="flex justify-center mb-4">
                  <Image
                    src={`${logoUrl}?t=${Date.now()}`}
                    alt="Logo"
                    width={120}
                    height={60}
                    className="object-contain"
                    unoptimized={logoUrl.includes('.s3.')}
                  />
                </div>
              ) : null}
              <h1 className="text-2xl font-semibold mb-2" style={{ color: titleColor }}>Consolle</h1>
              <p className="text-sm" style={{ color: textColor }}>Área Administrativa</p>
            </div>
            <SignInForm
              customColors={{
                buttonColor,
                buttonTextColor,
              }}
            />
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
            fetchPriority="high"
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
          <div className="lg:hidden mb-8 flex justify-center lg:justify-start">
            <Link href="/">
              <div className="relative p-2 rounded-lg bg-black/30 backdrop-blur-sm shadow-xl">
                <div
                  className="w-2/4 h-20"
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

          <div className="flex justify-center mb-8">
            <div
              className="w-2/4 h-20"
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

          <div className="mb-8 text-center sm:text-center">
            <h1 className="text-3xl font-bold-light text-white mb-2">
              Autenticação
            </h1>
            <p className="text-gray-300/80">
              Acompanhe suas transações.
            </p>
          </div>

          <SignInForm />
        </div>
      </div>
    </div>
  );
}
