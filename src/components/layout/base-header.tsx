import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

export type BreadcrumbItem = {
  title: string | React.ReactNode;
  subtitle: string | React.ReactNode;
  url?: string;
};

const BaseHeader = ({
  breadcrumbItems,
}: {
  breadcrumbItems: BreadcrumbItem[];
}) => {
  return (
    <header className="flex h-auto min-h-20 shrink-0 items-center gap-2 border-b px-6 justify-between py-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.url ? (
                    <BreadcrumbLink href={item.url}>
                      {item.title}
                      {item.subtitle && (
                        <>
                          {" "}
                          {item.subtitle}
                        </>
                      )}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>
                      {item.title}
                      {item.subtitle && (
                        <>
                          {" "}
                          {item.subtitle}
                        </>
                      )}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

export default BaseHeader;
