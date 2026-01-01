import { useNavigate } from "@tanstack/react-router";
import { PaymentListContainer } from "@truths/sales";

export function PaymentPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PaymentListContainer
        onNavigateToPayment={(id) =>
          navigate({
            to: "/sales/payments/$id",
            params: { id },
          })
        }
      />
    </div>
  );
}

