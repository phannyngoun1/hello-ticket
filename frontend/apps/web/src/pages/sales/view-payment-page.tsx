import { useParams } from "@tanstack/react-router";

export function ViewPaymentPage() {
  const { id } = useParams({ from: "/sales/payments/$id" });
  return <div>Payment Detail: {id}</div>;
}
