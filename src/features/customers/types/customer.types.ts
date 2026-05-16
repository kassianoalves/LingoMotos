export type Customer = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  documentNumber: string;
  email: string;
  address: string;
  notes: string;
  updatedAt: string;
};

export type CustomerInput = Omit<Customer, 'updatedAt'> & {
  id?: string;
};
