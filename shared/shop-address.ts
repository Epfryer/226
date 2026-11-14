const usStateCodes: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeUSStateCode(value: string) {
  const state = clean(value);
  return usStateCodes[state.toLowerCase()] || state.toUpperCase();
}

export function normalizeShopRecipient<T extends {
  name: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}>(recipient: T): T {
  const state = clean(recipient.state_code);
  return {
    ...recipient,
    name: clean(recipient.name),
    email: recipient.email.trim(),
    address1: clean(recipient.address1),
    address2: clean(recipient.address2),
    city: clean(recipient.city),
    state_code: recipient.country_code === "US" ? normalizeUSStateCode(state) : state,
    zip: clean(recipient.zip),
  };
}
