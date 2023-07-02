import dbclient from "./dbclient";
import { IdentityResponse } from "./types";

type Contact = {
    id: number;
    phoneNumber?: string;
    email?: string;
    linkedId?: number;
    linkPrecedence: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
};

class IdentityProcessor {
  email: string;
  phoneNumber: string;
  currentTimestamp: Date;

  contracts: any[];

  constructor(email: string, phoneNumber: string) {
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.currentTimestamp = new Date();
  }

  private async createPrimaryContact(): Promise<Contact> {
    const newContact = await dbclient.contact.create({
      data: {
        email: this.email,
        phoneNumber: this.phoneNumber,
        linkPrecedence: "primary",
      },
    });
    return newContact;
  }

  private async createSecondaryContact(
    primaryContact: Contact
  ): Promise<Contact> {
    const newContact = await dbclient.contact.create({
      data: {
        email: this.email,
        phoneNumber: this.phoneNumber,
        linkPrecedence: "secondary",
        linkedId: primaryContact.id,
      },
    });
    return newContact;
  }

  private async findContacts(
    emails: string[],
    phoneNumbers: string[],
    ids: number[]
  ): Promise<Contact[]> {
    const contactResponse: Contact[] = await dbclient.contact.findMany({
      where: {
        OR: [
          {
            email: {
              in: emails,
            },
          },
          {
            phoneNumber: {
              in: phoneNumbers,
            },
          },
          {
            id: {
              in: ids,
            },
          },
        ],
      },
    });
    return contactResponse;
  }


  private findOldestContact(contactResponse: Contact[]): Contact {
    const oldestContact = contactResponse.reduce((prev, current) => {
      return prev.createdAt < current.createdAt ? prev : current;
    });
    return oldestContact;
  }

  private async findAllLinkedContacts(): Promise<Contact[]> {
    let linkedContracts: Contact[] = await this.findContacts(
      [this.email],
      [this.phoneNumber],
      []
    );
    let fetchedEmails = new Set([this.email]);
    let fetchedPhoneNumbers = new Set([this.phoneNumber]);
    let fetchedIds = new Set(linkedContracts.map((contact) => contact.id));
    let foundAllLinkedContacts = false;
    while (!foundAllLinkedContacts) {
      const newEmails = linkedContracts
        .filter((contact) => contact.email && !fetchedEmails.has(contact.email))
        .map((contact) => contact.email);
      const newPhoneNumbers = linkedContracts
        .filter((contact) => contact.phoneNumber && !fetchedPhoneNumbers.has(contact.phoneNumber))
        .map((contact) => contact.phoneNumber);
      const newIds = linkedContracts
        .filter((contact) => contact.linkedId && !fetchedIds.has(contact.linkedId))
        .map((contact) => contact.linkedId);
      const newLinkedContracts = await this.findContacts(newEmails,newPhoneNumbers, newIds);
      
      linkedContracts = linkedContracts.concat(newLinkedContracts);
      
      newLinkedContracts.forEach((contact) => {
        if (contact.email) {
          fetchedEmails.add(contact.email);
        }
        if (contact.phoneNumber) {
          fetchedPhoneNumbers.add(contact.phoneNumber);
        }
        fetchedIds.add(contact.id);
      });

      if (newLinkedContracts.length === 0) {
        foundAllLinkedContacts = true;
      }
    }
    return linkedContracts;
  }

  private async findPrimaryContact(
    linkedContacts: Contact[]
  ): Promise<Contact> {
    const primaryContact = linkedContacts
      .filter((contact) => contact.linkPrecedence === "primary")
      .reduce((prev, current) => {
        return prev.createdAt < current.createdAt ? prev : current;
      });
    return primaryContact;
  }

  private async convertToSecondaryContacts(
    contacts: Contact[],
    primaryContact: Contact
  ): Promise<Contact[]> {
    await dbclient.contact.updateMany({
      where: {
        email: {
          in: contacts.map((contact) => contact.email),
        },
        phoneNumber: {
          in: contacts.map((contact) => contact.phoneNumber),
        },
      },
      data: {
        linkPrecedence: "secondary",
        linkedId: primaryContact.id,
        updatedAt: this.currentTimestamp,
      },
    });
    return contacts.map((contact) => {
      contact.linkPrecedence = "secondary";
      contact.linkedId = primaryContact.id;
      contact.updatedAt = this.currentTimestamp;
      return contact;
    });
  }

  public async process(): Promise<IdentityResponse> {
    const linkedContacts = await this.findAllLinkedContacts();
    // if no linked contacts, create primary contact
    if (linkedContacts.length === 0) {
      const primaryContact = await this.createPrimaryContact();
      return {
        contact: {
          primaryContatctId: primaryContact.id,
          emails: [primaryContact.email],
          phoneNumbers: [primaryContact.phoneNumber],
          secondaryContactIds: [],
        },
      };
    }
    // otherwise, find primary contact
    const primaryContact = await this.findPrimaryContact(linkedContacts);
    let secondaryContacts = linkedContacts.filter(
      (contact) => contact.id !== primaryContact.id
    );
    // if primary contact is not the oldest contact, convert all other contacts to secondary contacts
    if (primaryContact.id !== this.findOldestContact(linkedContacts).id) {
      secondaryContacts = await this.convertToSecondaryContacts(
        linkedContacts,
        primaryContact
      );
    }
    const isNewContact = !linkedContacts.some(
      (contact) =>
        contact.email === this.email &&
        contact.phoneNumber === this.phoneNumber
    );
    if (isNewContact) {
      const newContact = await this.createSecondaryContact(primaryContact);
      secondaryContacts.push(newContact);
    }

    const distinctEmails = new Set(
      secondaryContacts.map((contact) => contact.email).filter((email) => email)
    );
    distinctEmails.add(primaryContact.email);
    const distinctPhoneNumbers = new Set(
      secondaryContacts.map((contact) => contact.phoneNumber).filter((phoneNumber) => phoneNumber)
    );
    distinctPhoneNumbers.add(primaryContact.phoneNumber);

    const distinctSecondaryContactIds = new Set(
      secondaryContacts.map((contact) => contact.id).filter((id) => id)
    );

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails: sortByPrimary(
          [...distinctEmails],
          primaryContact.email
        ),
        phoneNumbers: sortByPrimary(
          [...distinctPhoneNumbers],
          primaryContact.phoneNumber
        ),
        secondaryContactIds: [...distinctSecondaryContactIds],
      },
    };
  }
}

function sortByPrimary<Type> (items: Type[], primary: Type): Type[] {
  const sortedItems = items.sort((a, b) => {
    if (a === primary) {
      return -1;
    }
    if (b === primary) {
      return 1;
    }
    return 0;
  });
  return sortedItems;
};

export default IdentityProcessor;
