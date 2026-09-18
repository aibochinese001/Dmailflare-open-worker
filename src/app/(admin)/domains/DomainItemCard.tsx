import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Globe2,
  Trash2,
} from "lucide-react";

export default function DomainItemCard({ item, dns, remove, loadDns }: any) {

  return (
    <div
      key={item.id}
      className="flex flex-col gap-3 rounded-3xl bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          <Globe2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-900">
            {item.hostname}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={item.status === "active" ? "success" : "secondary"}>
              {item.status}
            </Badge>
            {item.routingEnabled && <Badge variant="outline">routing</Badge>}
            {item.sendingEnabled && <Badge variant="outline">sending</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadDns(item.id)}>
            DNS
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => remove.mutate(item.id)}
            disabled={remove.isPending}
            aria-label={`Remove ${item.hostname}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {dns && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-neutral-500">
            Routing{" "}
            {dns.routing.configured ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </span>
          {dns.routing.missing.length > 0 && (
            <span className="text-red-600 flex items-center gap-1">
              <X className="h-3 w-3" />
              Missing: {dns.routing.missing.join(", ")}
            </span>
          )}
          <span className="text-neutral-300">|</span>
          <span className="flex items-center gap-1 text-neutral-500">
            Sending{" "}
            {dns.sending.configured ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </span>
          {dns.sending.records.length > 0 && (
            <span className="text-neutral-500">
              {dns.sending.records.join(", ")}
            </span>
          )}
          <button
            onClick={() => loadDns(item.id)}
            className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800"
          >
            <ArrowRight className="h-3 w-3" />
            details
          </button>
        </div>
      )}
    </div>
  );
}
