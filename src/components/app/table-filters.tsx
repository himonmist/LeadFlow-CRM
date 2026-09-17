"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/form";

export function SelectFilter({
  name,
  options,
  placeholder,
}: {
  name: string;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      className="w-48"
      defaultValue={searchParams.get(name) ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(name, e.target.value);
        else params.delete(name);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
