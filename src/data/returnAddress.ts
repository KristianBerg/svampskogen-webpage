// Where customers send returned goods. Differs from the company address on
// purpose: the shop on Claesgatan isn't staffed every day. Used by both the
// site and the Worker's confirmation email.
export const returnAddress = {
  // A home address, so the parcel needs a person's name to reach the letterbox.
  recipient: 'Svampstugan AB, c/o Kristian Berg',
  street: 'Nikolaigatan 4a',
  postalCity: '214 21 Malmö',
}

export const returnAddressOneLine = `${returnAddress.recipient}, ${returnAddress.street}, ${returnAddress.postalCity}`
