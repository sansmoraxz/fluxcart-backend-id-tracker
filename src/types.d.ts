type IdentityRequest = {
    email?: string;
    phoneNumber?: number;
};

type IdentityResponse = {
  contact: {
    primaryContatctId: number;
    emails: string[]; // first element being email of primary contact
    phoneNumbers: string[]; // first element being phoneNumber of primary contact
    secondaryContactIds: number[]; // Array of all Contact IDs that are "secondary" to the primary contact
  };
};

export type { IdentityRequest, IdentityResponse };
