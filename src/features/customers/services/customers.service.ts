import { serviceClient } from '@shared/api/service-client';
import type { Customer, CustomerInput } from '../types/customer.types';

type CustomerDto = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  motorcycleModel: string;
  documentNumber: string;
  email: string;
  address: string;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const customersService = {
  async list(): Promise<Customer[]> {
    const customers = await serviceClient.execute<CustomerDto[]>('list_customers');
    return customers.map(fromDto);
  },
  async save(customer: CustomerInput): Promise<Customer> {
    const command = customer.id ? 'update_customer' : 'create_customer';
    const saved = await serviceClient.execute<CustomerDto, { customer: CustomerInput }>(command, { customer });
    return fromDto(saved);
  },
  async remove(id: string): Promise<void> {
    await serviceClient.execute<void, { id: string }>('deactivate_customer', { id });
  },
};

function fromDto(customer: CustomerDto): Customer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
    motorcycleModel: customer.motorcycleModel,
    documentNumber: customer.documentNumber,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
    updatedAt: customer.updatedAt.slice(0, 10),
  };
}
