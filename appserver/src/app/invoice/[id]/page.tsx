import React from "react";
import InvoicePageClient from "./invoice";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params); // ✅ unwrap on server side
  return <InvoicePageClient id={id} />;
}
