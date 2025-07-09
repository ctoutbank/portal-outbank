export type Terminal = {
  slug: string;
  active: boolean;
  dtInsert: Date | string;
  dtUpdate: Date | string;
  logicalNumber: string;
  type?: string;
  status?: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  pinpadSerialNumber?: string;
  pinpadFirmware?: string;
  slugMerchant: string;
  merchant?: {
    slug: string;
    name: string;
    documentId: string;
  };
  slugCustomer?: string;
  customer?: {
    slug: string;
    name: string;
  };
  pverfm?: string;
  goUpdate?: boolean;
  inactivationDate?: Date | string;
  uniqueNumberForMerchant?: number;
  initialized?: string;
  firmwareVersion?: string;
};
