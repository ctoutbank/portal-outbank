"use server";

/**
 * Sincroniza usuarios criados no portal-outbank com a instancia do Clerk do outbank-one
 * 
 * O portal-outbank usa a instancia internal-giraffe-9 do Clerk
 * O outbank-one usa a instancia driven-pipefish-62 do Clerk
 * 
 * Quando um usuario ISO e criado no portal, ele precisa existir em AMBAS as instancias
 * para que possa fazer login tanto no portal quanto no ISO
 */

const OUTBANK_ONE_CLERK_SECRET_KEY = process.env.OUTBANK_ONE_CLERK_SECRET_KEY;
const CLERK_API_BASE = "https://api.clerk.com/v1";

interface SyncUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface SyncUserResult {
  success: boolean;
  clerkUserId?: string;
  error?: string;
  action?: 'created' | 'updated' | 'skipped';
}

/**
 * Sincroniza um usuario com a instancia do Clerk do outbank-one
 * Se o usuario ja existe, atualiza a senha
 * Se nao existe, cria um novo usuario
 */
export async function syncUserToOutbankOneClerk(input: SyncUserInput): Promise<SyncUserResult> {
  if (!OUTBANK_ONE_CLERK_SECRET_KEY) {
    console.warn("[syncUserToOutbankOneClerk] OUTBANK_ONE_CLERK_SECRET_KEY nao configurada, pulando sincronizacao");
    return { success: true, action: 'skipped' };
  }

  const { email, firstName, lastName, password } = input;
  const normalizedEmail = email.trim().toLowerCase();

  console.log(`[syncUserToOutbankOneClerk] Iniciando sincronizacao para: ${normalizedEmail}`);

  try {
    // 1. Buscar usuario existente pelo email
    const searchResponse = await fetch(
      `${CLERK_API_BASE}/users?email_address=${encodeURIComponent(normalizedEmail)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${OUTBANK_ONE_CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[syncUserToOutbankOneClerk] Erro ao buscar usuario: ${searchResponse.status} - ${errorText}`);
      return { success: false, error: `Erro ao buscar usuario: ${searchResponse.status}` };
    }

    const existingUsers = await searchResponse.json();

    if (existingUsers && existingUsers.length > 0) {
      // Usuario existe, atualizar senha
      const existingUser = existingUsers[0];
      console.log(`[syncUserToOutbankOneClerk] Usuario encontrado no outbank-one Clerk: ${existingUser.id}`);

      const updateResponse = await fetch(
        `${CLERK_API_BASE}/users/${existingUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${OUTBANK_ONE_CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
            skip_password_checks: false,
            public_metadata: {
              isFirstLogin: true,
              syncedFromPortal: true,
              syncedAt: new Date().toISOString(),
            },
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`[syncUserToOutbankOneClerk] Erro ao atualizar usuario: ${updateResponse.status} - ${errorText}`);
        // Nao falhar se a atualizacao de senha falhar (pode ser senha comprometida)
        // O usuario ainda pode tentar fazer login com a senha antiga
        return { success: true, clerkUserId: existingUser.id, action: 'skipped' };
      }

      console.log(`[syncUserToOutbankOneClerk] Senha atualizada com sucesso para usuario: ${existingUser.id}`);
      return { success: true, clerkUserId: existingUser.id, action: 'updated' };
    }

    // 2. Usuario nao existe, criar novo
    console.log(`[syncUserToOutbankOneClerk] Usuario nao encontrado, criando novo...`);

    const createResponse = await fetch(
      `${CLERK_API_BASE}/users`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OUTBANK_ONE_CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: [normalizedEmail],
          first_name: firstName,
          last_name: lastName,
          password,
          skip_password_checks: false,
          public_metadata: {
            isFirstLogin: true,
            syncedFromPortal: true,
            syncedAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`[syncUserToOutbankOneClerk] Erro ao criar usuario: ${createResponse.status} - ${errorText}`);
      
      // Verificar se e erro de senha comprometida
      if (errorText.includes("pwned") || errorText.includes("compromised")) {
        return { success: false, error: "Senha comprometida. Por favor, escolha uma senha mais segura." };
      }
      
      return { success: false, error: `Erro ao criar usuario no ISO: ${createResponse.status}` };
    }

    const newUser = await createResponse.json();
    console.log(`[syncUserToOutbankOneClerk] Usuario criado com sucesso: ${newUser.id}`);
    return { success: true, clerkUserId: newUser.id, action: 'created' };

  } catch (error) {
    console.error(`[syncUserToOutbankOneClerk] Erro inesperado:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Verifica se a sincronizacao com outbank-one esta configurada
 */
export async function isOutbankOneSyncEnabled(): Promise<boolean> {
  return !!OUTBANK_ONE_CLERK_SECRET_KEY;
}
