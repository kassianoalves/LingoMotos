import { MessageCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { isValidWhatsappPhone, openWhatsapp } from '@/utils/openWhatsapp';
import type { Customer } from '../types/customer.types';

type CustomerWhatsappButtonProps = {
  customer: Customer;
  onInvalidPhone: () => void;
  onOpening: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  label?: string;
};

export function CustomerWhatsappButton({
  customer,
  onInvalidPhone,
  onOpening,
  variant = 'outline',
  size = 'sm',
  label = 'WhatsApp',
}: CustomerWhatsappButtonProps) {
  const phone = customer.whatsapp || customer.phone;
  const disabled = !isValidWhatsappPhone(phone);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title="Abrir WhatsApp"
      aria-label="Abrir WhatsApp"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();

        const result = openWhatsapp(phone, `Olá, ${customer.name}. Aqui é da LingoMotos.`);

        if (!result.ok) {
          onInvalidPhone();
          return;
        }

        onOpening();
      }}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </Button>
  );
}
