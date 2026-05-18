"use client";

import { Card, CardContent } from "@/components/ui/card";

export function AdminListStats({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}