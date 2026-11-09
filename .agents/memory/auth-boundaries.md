---
name: Account scope and owner trust
description: Preserve the explicitly requested local-account scope and public access boundary.
---

Keep the existing username/password account method unless a provider change is explicitly requested. Public portfolio reading, inquiries, Studio browsing, and guest checkout must remain independent of accounts; orders must retain their anonymous ownership boundary.

**Why:** The user chose username/password to match the existing user schema and explicitly excluded social sign-in, account-linked orders, email verification, and self-service recovery from the initial account feature.

**How to apply:** Do not treat a generic auth-library default as permission to migrate account providers or attach old guest orders to accounts. Owner status requires trusted, explicitly targeted provisioning, never signup input or first-user-wins.
