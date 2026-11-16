export const INQUIRY_EMAIL = "inquiry@ethanfryer.com";
export const SUPPORT_EMAIL = "support@ethanfryer.com";

export function isSender(from: string | undefined, address: string): from is string {
  if (!from) return false;
  const mailbox = /^([^<>\r\n]+) <([^<>\r\n]+)>$/.exec(from);
  return (mailbox ? mailbox[2] : from).toLowerCase() === address.toLowerCase();
}
