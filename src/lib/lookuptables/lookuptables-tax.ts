export interface SelectItem {
    value: string;
    label: string;
    color?: string;
  }
  
  export interface SelectItemSolicitationFee extends SelectItem {
    transactionFeeStart: string;
    transactionFeeEnd: string;
  }



export const brandList: SelectItem[] = [
    { value: "MASTERCARD", label: "Master" },
    { value: "VISA", label: "Visa" },
    { value: "ELO", label: "Elo" },
    { value: "AMEX", label: "Amex" },
    { value: "HIPERCARD", label: "Hipercard" },
    { value: "CABAL", label: "Cabal" },
  ];


  export const PricingSolicitationStatus: SelectItem[] = [
    {
      value: "PENDING",
      label: "Pendente",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      value: "REVIEWED",
      label: "Revisado",
      color: "bg-gray-500 hover:bg-gray-600",
    },
    {
      value: "APPROVED",
      label: "Aprovado",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      value: "CANCELED",
      label: "Cancelado",
      color: "bg-red-500 hover:bg-red-600",
    },
  ];
  
  export const SolicitationFeeProductTypeList: SelectItemSolicitationFee[] = [
    {
      value: "DEBIT",
      label: "Débito",
      transactionFeeStart: "0",
      transactionFeeEnd: "0",
    },
    {
      value: "CREDIT",
      label: "Crédito a Vista",
      transactionFeeStart: "0",
      transactionFeeEnd: "0",
    },
    {
      value: "CREDIT_INSTALLMENTS_2_TO_6",
      label: "Crédito (2-6x)",
      transactionFeeStart: "2",
      transactionFeeEnd: "6",
    },
    {
      value: "CREDIT_INSTALLMENTS_7_TO_12",
      label: "Crédito (7-12x)",
      transactionFeeStart: "7",
      transactionFeeEnd: "12",
    },
    {
      value: "VOUCHER",
      label: "Voucher",
      transactionFeeStart: "0",
      transactionFeeEnd: "0",
    },
    {
      value: "PREPAID_CREDIT",
      label: "Pré-pago",
      transactionFeeStart: "0",
      transactionFeeEnd: "0",
    },
  ];


