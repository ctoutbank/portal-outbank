import { Merchant } from "../sync-merchant/types";

export type MerchantPrice = {
    
    slug: string;
    active: boolean;
    dtInsert: Date;
    dtUpdate: Date;
    merchant: Merchant;
    name: string;
    tableType: string;
    anticipationType: string;
    cardPixMdr: number;
    cardPixCeilingFee: number;
    cardPixMinimumCostFee: number;
    nonCardPixMdr: number;
    nonCardPixCeilingFee: number;
    nonCardPixMinimumCostFee: number;
    merchantSlug: string;
    compulsoryAnticipationConfig: number;
    eventualAnticipationFee: number;
}
