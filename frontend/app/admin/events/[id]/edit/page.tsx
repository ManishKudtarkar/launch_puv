"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * This route is deprecated. All event editing is now unified into the
 * Event Creation Wizard at /admin/events/create?event={id}.
 */
export default function EditEventRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/admin/events/create?event=${id}`);
    } else {
      router.replace("/admin/events");
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
      Redirecting to Event Wizard...
    </div>
  );
}
