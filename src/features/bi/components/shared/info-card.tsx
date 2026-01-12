"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InfoCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor?: "neutral" | "green" | "red";
  subtitle?: string;
};

const ICON_COLORS = {
  neutral: "text-muted-foreground",
  green: "text-green-400",
  red: "text-red-400"
};

export function InfoCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "neutral",
  subtitle
}: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${ICON_COLORS[iconColor]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
