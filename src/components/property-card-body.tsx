import { MapPin, Users, Wifi, UserRound, CalendarClock } from "lucide-react";
import type { Property } from "@/lib/types";
import { titleCase, formatDate } from "@/lib/format";

function formatMaybeDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return formatDate(value);
}

export default function PropertyCardBody({ property }: { property: Property }) {
  const details = property.details ?? {};
  const service = [details.service_type, details.plan_speed].filter(Boolean).join(" · ");

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (property.island) {
    rows.push({
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: "Island",
      value: titleCase(property.island),
    });
  }
  if (details.billable_units) {
    rows.push({
      icon: <Users className="h-3.5 w-3.5" />,
      label: "Billable units",
      value: details.billable_units,
    });
  }
  if (service) {
    rows.push({
      icon: <Wifi className="h-3.5 w-3.5" />,
      label: "Service",
      value: service,
    });
  }
  if (details.account_manager) {
    rows.push({
      icon: <UserRound className="h-3.5 w-3.5" />,
      label: "Account Manager",
      value: details.account_manager,
    });
  }
  if (details.contract_end) {
    rows.push({
      icon: <CalendarClock className="h-3.5 w-3.5" />,
      label: "End of contract",
      value: formatMaybeDate(details.contract_end),
    });
  }

  return (
    <div className="space-y-1.5 text-foreground">
      {property.address ? (
        <div className="text-xs truncate">{property.address}</div>
      ) : null}
      {rows.length === 0 ? (
        <div className="text-xs">No details yet</div>
      ) : (
        <dl className="space-y-1 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline gap-2">
              <span className="inline-flex items-center gap-1 shrink-0 font-medium">
                {r.icon}
                {r.label}
              </span>
              <span className="truncate">{r.value}</span>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
