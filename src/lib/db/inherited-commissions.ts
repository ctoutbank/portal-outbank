import { sql } from '@vercel/postgres';

// Normalizar margem: trocar vírgula por ponto para parseFloat correto
const normalizeMargin = (value: string | null | undefined): number => {
  if (!value) return 0;
  const normalized = String(value).replace(',', '.');
  return parseFloat(normalized) || 0;
};

export interface InheritedCommission {
  customerId: number;
  customerName: string;
  categoryType: string;
  commissionPercent: number;
}

export async function getInheritedCommissions(userId: number): Promise<InheritedCommission[]> {
  const { rows } = await sql.query(`
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      uc.commission_type,
      u.user_type,
      imc.margin_outbank,
      imc.margin_executivo,
      imc.margin_core
    FROM user_customers uc
    JOIN customers c ON uc.id_customer = c.id
    JOIN users u ON uc.id_user = u.id
    LEFT JOIN iso_margin_config imc ON uc.id_customer = imc.customer_id
    WHERE uc.id_user = $1 AND uc.active = true
  `, [userId]);

  // Filtrar e mapear resultados
  return rows
    .filter((row: any) => {
      const userType = row.user_type || '';
      const commissionType = row.commission_type;
      
      // Super Admin sempre herda margin_outbank, independente do commission_type
      if (userType === 'SUPER_ADMIN') {
        return true;
      }
      
      // Para outros usuários, apenas incluir se tiver commission_type definido
      return commissionType !== null && commissionType !== undefined && commissionType !== '';
    })
    .map((row: any) => {
      const userType = row.user_type || '';
      const commissionType = row.commission_type || '';
      let commissionPercent = 0;
      let effectiveCategoryType = commissionType;
      
      if (userType === 'SUPER_ADMIN') {
        commissionPercent = normalizeMargin(row.margin_outbank);
        effectiveCategoryType = 'OUTBANK';
      } else if (commissionType === 'EXECUTIVO') {
        commissionPercent = normalizeMargin(row.margin_executivo);
      } else if (commissionType === 'CORE') {
        commissionPercent = normalizeMargin(row.margin_core);
      }

      return {
        customerId: Number(row.customer_id),
        customerName: row.customer_name || 'N/A',
        categoryType: effectiveCategoryType,
        commissionPercent,
      };
    });
}

export async function getUserCategoryType(userId: number): Promise<string> {
  const { rows } = await sql.query(`
    SELECT u.user_type, p.category_type
    FROM users u
    LEFT JOIN profiles p ON u.id_profile = p.id
    WHERE u.id = $1
  `, [userId]);

  if (rows[0]?.user_type === 'SUPER_ADMIN') {
    return 'OUTBANK';
  }
  return rows[0]?.category_type || 'OUTRO';
}
