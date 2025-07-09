"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PricingSolicitationStatus } from "@/lib/lookuptables/lookuptables";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { PricingSolicitationList } from "../server/pricing-solicitation";

export default function PricingSolicitationList({
  solicitations,
}: {
  solicitations: PricingSolicitationList;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CNAE</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitations.pricingSolicitations.map((solicitation) => (
              <TableRow key={solicitation.id}>
                <TableCell>
                  <a
                    className="underline"
                    href={`/portal/pricingSolicitation/${solicitation.id}`}
                  >
                    {solicitation.cnae}
                  </a>
                </TableCell>
                <TableCell>
                  {solicitation.dtinsert
                    ? formatDate(new Date(solicitation.dtinsert))
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      PricingSolicitationStatus.find(
                        (status) => status.value === solicitation.status
                      )?.color
                    } text-white px-2 py-1 rounded-md`}
                  >
                    {
                      PricingSolicitationStatus.find(
                        (status) => status.value === solicitation.status
                      )?.label
                    }
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
