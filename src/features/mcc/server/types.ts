/**
 * Tipos TypeScript para MCC e MCC Groups
 */

import type { SelectMcc, SelectMccGroup } from "@/db/drizzle";

export type MccGroup = SelectMccGroup;
export type Mcc = SelectMcc;

export type MccWithGroup = SelectMcc & {
  groupDescription: string;
  groupId: number;
};

export type MccListResponse = {
  data: MccWithGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

