# Listing Schemas (Design)

How **residential** listings are stored. Both listing types follow their "Create New ..." screens: one main schema for the basic details, plus one schema per tab.

- **Part 1: Property** (sections 1–15): one home. Code in `src/models/property/`.
- **Part 2: Development** (sections 16–22): a group of homes from one housing provider. Code in `src/models/development/`.
- Residential only, UK only.
- Money is stored in **pence as whole numbers** (e.g. £250,000 → `25000000`). The API converts to/from pounds.
- Dropdown values: `src/common/propertyOptions.js` and `src/common/developmentOptions.js`.
- Helpers used by both (address, map pin, files, tab back-reference, gallery images): `src/models/shared.js`.

---

# Part 1: Property

## 1. Structure: 1 main schema + 8 tab schemas

| Screen tab | Schema | Collection | Referenced from `Property` as |
|---|---|---|---|
| Location | **`Property`** (main) | `properties` | — |
| Details | `PropertyDetails` | `propertydetails` | `details` |
| Description | `PropertyDescription` | `propertydescriptions` | `description` |
| Eligibility | `PropertyEligibility` | `propertyeligibilities` | `eligibility` |
| Gallery | `PropertyGallery` | `propertygalleries` | `gallery` |
| Videos & Virtual Tours | `PropertyVideoTour` | `propertyvideotours` | `videoTour` |
| Attachments | `PropertyAttachments` | `propertyattachments` | `attachments` |
| Extras (premium) | `PropertyExtras` | `propertyextras` | `extras` |
| Enquiry Contacts | `PropertyEnquiryContacts` | `propertyenquirycontacts` | `enquiryContacts` |

```
                         ┌──► PropertyDetails
                         ├──► PropertyDescription
                         ├──► PropertyEligibility
Property ── ref ids ─────├──► PropertyGallery
(name, address, owner)   ├──► PropertyVideoTour
                         ├──► PropertyAttachments
                         ├──► PropertyExtras
                         └──► PropertyEnquiryContacts
```

How the links work:
- `Property` stores one ref id per tab (`details`, `description`, ...). Each is `null` until that tab is saved for the first time.
- Every tab document stores `property` (ref back to `Property`), with a **unique** index. So each property has at most one document per tab, and a tab can be found from the property id alone.
- Every tab document also has `updatedBy` (→ User) and `createdAt` / `updatedAt`.

---

## 2. `Property` (main schema, Location tab)

### Basic details (Location tab)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | yes | Listing name, max 150, e.g. "2 bed flat, Riverside Quarter" |
| `reference` | String | no | Owner's own identifier. Unique per owner |
| `development` | ObjectId → Development | no | "Assign to Development". Organisation listings only, and the development must have the same owner (checked in the service). See Part 2 |
| `address.postcode` | String | to publish | Stored uppercase, validated as a UK postcode |
| `address.line1` | String | to publish | |
| `address.line2` | String | no | |
| `address.townCity` | String | to publish | |
| `address.localAuthority` | String | to publish | Borough / local authority |
| `location` | GeoJSON Point | to publish | Map pin: `{ type: 'Point', coordinates: [lng, lat] }` |

"Housing Provider" on the screen is not stored separately: it is the `owner` when `ownerType` is `organisation`.

### Ownership

| Field | Type | Required | Notes |
|---|---|---|---|
| `ownerType` | String | yes | `user` \| `organisation` |
| `owner` | ObjectId → User | yes | The individual user, or the organisation account |
| `createdBy` | ObjectId → User | yes | Who created it (may be an org member) |
| `updatedBy` | ObjectId → User | no | |
| `assignedTo` | ObjectId → User | no | Organisation listings only: org admin / org user handling it |

The server sets these from the logged-in user. They are never taken from the request body.

| Logged-in role | `ownerType` | `owner` |
|---|---|---|
| `user` | `user` | own id |
| `organisation` | `organisation` | own id |
| `organisation-admin` / `organisation-user` | `organisation` | their `organisationId` |
| `admin` | cannot create listings | — |

### Lifecycle

| Field | Type | Notes |
|---|---|---|
| `status` | String | `draft` \| `pending_approval` \| `live` \| `archived` \| `suspended`. Default `draft` |
| `isPremium` | Boolean | Unlocks Extras tab, FAQs and Walkly tour URL |
| `publishedAt` | Date | First time it went `live` |
| `moderation` | `{ reason, by, at }` | Set when an admin suspends a listing |
| `approval` | `{ requestType, submittedAt, submittedBy, decision, reason, reviewedBy, reviewedAt }` | Listings that need approval: individual users' (platform admin approves) and organisation users' (organisation / organisation admin approves). `requestType` is `create` (never been live) or `edit` (has been live), which decides the queue |
| `completion` | `{ isComplete, completedSections, missingSections }` | Recomputed on every section save, so list pages can show progress without loading the tabs |

`status` is whether the listing is visible. Market availability (`coming_soon`, `available`, `under_offer`, `sold`) is a separate field on the Details tab.

### Tab references

`details`, `description`, `eligibility`, `gallery`, `videoTour`, `attachments`, `extras`, `enquiryContacts`: each an ObjectId, default `null`.

### Search snapshot

| Field | Copied from |
|---|---|
| `searchSnapshot.schemeType` | Details |
| `searchSnapshot.availability` | Details |
| `searchSnapshot.propertyType` | Details |
| `searchSnapshot.fullMarketValue` | Details → pricing |
| `searchSnapshot.minimumSharePercentage` | Details |
| `searchSnapshot.bedrooms` | Description |
| `searchSnapshot.primaryImageUrl` | Gallery |

Search filters and dashboard cards need these fields on every row. Keeping a small copy on `Property` means list pages don't have to join 8 collections. The property service updates the snapshot whenever the Details, Description or Gallery tab is saved. The tab documents remain the source of truth.

### Stats, soft delete, timestamps

| Field | Type | Notes |
|---|---|---|
| `stats.views` | Number | |
| `stats.enquiries` | Number | |
| `isDeleted` / `deletedAt` / `deletedBy` | Boolean / Date / ObjectId | Deleting hides the listing but keeps it, so enquiries still point to it |
| `createdAt` / `updatedAt` | Date | |

---

## 3. `PropertyDetails` (Details tab)

### Scheme and pricing

| Field | Type | Notes |
|---|---|---|
| `schemeType` | String | `shared_ownership` \| `shared_ownership_resale` \| `older_persons_shared_ownership` \| `home_ownership_long_term_disabilities` \| `rent_to_buy` \| `discounted_market_sale` \| `first_homes` |
| `availability` | String | `coming_soon` \| `available` \| `under_offer` \| `sold`. "Coming soon" hides pricing on the public page |
| `propertyType` | String | `flat` \| `studio` \| `maisonette` \| `terraced_house` \| `end_of_terrace_house` \| `semi_detached_house` \| `detached_house` \| `bungalow` \| `townhouse` |
| `minimumSharePercentage` | Number | 1–100 |
| `tenure` | String | `leasehold` \| `freehold` \| `share_of_freehold` \| `commonhold` |
| `leaseYearsRemaining` | Number | For leasehold |
| `councilTaxBand` | String | `A`–`I` |
| `floor` | Number | `-1` basement, `0` ground |
| `pricing.fullMarketValue` | pence | |
| `pricing.monthlyRentAtMinShare` | pence | Shared ownership |
| `pricing.serviceChargeMonthly` | pence | |
| `pricing.groundRentAnnual` | pence | |
| `pricing.monthlyRent` | pence | Rent to buy |
| `pricing.discountPercentage` | Number | Discounted market sale / First Homes |

The screen shows the price fields only after a scheme type is chosen. Which pricing fields are required depends on `schemeType`; the service checks this.

### Material information

| Field | Type | Notes |
|---|---|---|
| `materials` | String (rich text) | |
| `parking` | String | `none` \| `on_street` \| `permit` \| `allocated` \| `garage` \| `driveway` \| `underground` |
| `outsideSpace` | [String] | `balcony` \| `terrace` \| `roof_terrace` \| `private_garden` \| `communal_garden` |
| `accessibleMeasures` | [String] | `step_free_access` \| `lift_access` \| `wheelchair_accessible` \| `level_access_shower` \| `wide_doorways` \| `ground_floor_bedroom` |
| `totalRooms` | Number | |
| `rooms` | [{ `name`, `length`, `width`, `unit` (`m`\|`ft`), `description` }] | "Add Room Details" |
| `furnished` | String | `unfurnished` \| `part_furnished` \| `furnished` |
| `washingMachine` / `dishwasher` / `fridgeFreezer` | String | `included` \| `integrated` \| `not_included` |
| `yearBuilt` | Number | |
| `unitSize` | `{ value, scale }` | `value` is rounded to a whole number; `scale` is `sq_ft` \| `sq_m`. Both required together |
| `communalLift` | Boolean | |
| `floodedInLast5Years` | Boolean | |
| `listedStatus` | String | `not_listed` \| `grade_i` \| `grade_ii_star` \| `grade_ii` \| `category_a` \| `category_b` \| `category_c` (Scotland) |
| `heatingDetails` | String | |
| `sewerageSupply` | String | `mains` \| `septic_tank` \| `cesspit` \| `treatment_plant` \| `other` |
| `waterSupply` | String | `mains` \| `private` \| `other` |
| `electricitySupply` | String | `mains` \| `mains_with_solar` \| `off_grid` \| `other` |
| `broadband` | String | `none` \| `adsl` \| `fttc` \| `fttp` \| `cable` \| `satellite` \| `mobile` \| `other` |
| `faqs` | [{ `question`, `answer` }] | Premium only |

For yes/no dropdowns stored as Boolean, "not answered" is left empty (not `false`).

---

## 4. `PropertyDescription` (Description tab)

| Field | Type | Notes |
|---|---|---|
| `summary` | String | Short sales line, max 200 |
| `description` | String (rich text) | Sanitised HTML |
| `keyFeatures` | String (rich text) | Sanitised HTML list |
| `bedrooms` | Number | Whole number, `0` = studio |
| `bathrooms` | Number | Whole number |
| `petsAllowed` | String | `yes` \| `no` \| `on_request` |
| `accessibility` | String | Building Regs Part M: `m4_1_visitable` \| `m4_2_accessible_adaptable` \| `m4_3_wheelchair_user` |

---

## 5. `PropertyEligibility` (Eligibility tab)

| Field | Type | Notes |
|---|---|---|
| `criteria` | [{ `type`, `value` }] | Each type at most once |
| `criteriaText` | String (rich text) | Shown to buyers. Generated from `criteria` ("Refresh Eligibility Text") or written by hand |
| `isCustomText` | Boolean | `true` once edited by hand, so a refresh asks before overwriting |

Criterion types and value types:

| `type` | `value` |
|---|---|
| `max_household_income`, `min_household_income`, `min_deposit` | pence |
| `min_age` | Number |
| `local_connection`, `live_or_work_in_area` | String (area name) |
| `first_time_buyer`, `no_other_property`, `key_worker`, `armed_forces`, `existing_social_tenant` | Boolean |

When a buyer enquires, their details are checked against `criteria`. The enquiry is marked **Priority** if they meet all criteria, otherwise **Non-priority**, and the buyer is told the result.

"Set Default Based On Scheme Type" fills `criteria` with scheme defaults (e.g. £80k income cap, or £90k in London).

---

## 6. `PropertyGallery` (Gallery tab)

| Field | Type | Notes |
|---|---|---|
| `images` | [Image] | Max 50, at most one `isPrimary` |

Image: `url`, `storageKey`, `fileName`, `mimeType` (`image/jpeg` \| `image/png`), `sizeBytes` (max 10 MB), `caption`, `order`, `isPrimary`, `uploadedBy`, `uploadedAt`.

Recommended: 2:1 aspect ratio, around 1 MB.

---

## 7. `PropertyVideoTour` (Videos & Virtual Tours tab)

| Field | Type | Notes |
|---|---|---|
| `videoProvider` | String | `none` \| `youtube` \| `vimeo`. Default `none` |
| `videoUrl` | https URL | Required when provider is not `none` |
| `virtualTourSupplier` | String | From a supplier dropdown |
| `virtualTourUrl` | https URL | |
| `walklyTourUrl` | https URL | Premium only |

For virtual tours, only the `src` URL from the supplier's embed code is stored. Raw `<iframe>` HTML is never saved, because rendering user-supplied HTML would let someone inject scripts into the site. The frontend builds the iframe from the URL.

If the property has no virtual tour of its own and its development has `applyVirtualTourToProperties` on, the development's tour is shown.

---

## 8. `PropertyAttachments` (Attachments tab)

| Field | Type | Limit |
|---|---|---|
| `brochures` | [File] | Max 2 |
| `priceList` | File | 1 |
| `floorPlan` | File | 1 |
| `energyCertificate` | File | 1 (EPC) |
| `sitePlan` | File | 1 |
| `keyInformationDocument` | File | 1 |
| `keyInformationUrl` | https URL | |

File: `url`, `storageKey`, `fileName`, `mimeType` (`application/pdf` \| `image/jpeg` \| `image/png`), `sizeBytes`, `uploadedBy`, `uploadedAt`. Images max 10 MB, checked at upload.

When the property's development has `applyBrochuresToProperties` or `applySitePlanToProperties` on, the development's files are shown instead, and the property's `brochures` / `sitePlan` can't be edited.

---

## 9. `PropertyExtras` (Extras tab, premium only)

| Field | Type | Notes |
|---|---|---|
| `responderEmail` | String | One of the organisation's responder emails; copied on every enquiry |
| `announcement` | String | Max 150, e.g. "Open Day 5 Oct" |
| `announcementEndDate` | Date | Announcement is hidden after this date. Needs an `announcement` |

---

## 10. `PropertyEnquiryContacts` (Enquiry Contacts tab)

| Field | Type | Notes |
|---|---|---|
| `salesTelephone` | String | Override for this property |
| `salesEmail` | String | Override for this property |

Only the overrides are stored. The defaults shown on the screen come from the owner: organisation profile `phone` / `contactEmail`, or the user's own details.

Enquiries use the first contact that is set:
1. This property's override.
2. Its development's `salesTelephone` / `salesEmail`.
3. The owner's default.

---

## 11. Draft vs publish

- **Create Draft** needs only `name` (plus ownership, set by the server). Tabs can be filled in any order, each saved separately.
- Status moves automatically after every section save. Once the required sections below are complete, an organisation listing goes `live`, and an individual user's listing goes to `pending_approval`. Every later edit to a user's listing sends it back to `pending_approval` (edit queue). A listing that becomes incomplete goes back to `draft`.
- **Publish** (`live`) or **submit for approval** (`pending_approval`) requires:
  - Location: full address and map pin.
  - Details: scheme type, availability, property type, tenure, and the pricing fields required by that scheme.
  - Description: summary, description, bedrooms, bathrooms.
  - Gallery: at least 1 image.
  - Attachments: energy certificate (legally required to market a home in the UK).
- Premium-only fields (Extras tab, `faqs`, `walklyTourUrl`) are rejected unless `isPremium` is true.

---

## 12. Status flow

```
draft ──► pending_approval ──► live ──► archived ──► draft (relist)
  │            │ (rejected)     ▲
  │            └──► draft       │
  └─────────────────────────────┘ (direct publish)

any ──► suspended ──► previous status   (admin only)
```

- `organisation` and `organisation-admin` publish directly.
- `user` listings need platform-admin approval on create and on every edit; the listing is not live while an edit is pending.
- `organisation-user` can only submit for approval; `organisation` or `organisation-admin` approves.

---

## 13. Dashboard permissions

| Role | Sees | Create | Edit | Publish | Delete | Assign |
|---|---|---|---|---|---|---|
| `user` | Own listings | yes | own | needs admin approval | own | — |
| `organisation` | All org listings | yes | all org | yes | all org | yes |
| `organisation-admin` | All org listings | yes | all org | yes + approve | all org | yes |
| `organisation-user` | Org listings they created or are assigned to | yes | those | submit only | no | no |
| `admin` | All listings | no | no | approves / rejects `user` listings | all (soft delete) | no |

Dashboard header counts (Live Properties, Premium Listings, etc.) come from `Property` alone.

---

## 14. Indexes (on `Property`)

| Index | Purpose |
|---|---|
| `{ owner, status, createdAt }` | User / organisation dashboard |
| `{ owner, assignedTo, status }` | Organisation-user dashboard |
| `{ createdBy, createdAt }` | "Created by me" |
| `{ development }` | Properties in a development |
| `{ status, address.postcode }` | Search by area |
| `{ status, searchSnapshot.schemeType, .availability, .bedrooms, .fullMarketValue }` | Search filters |
| `{ location: 2dsphere }` | Map / radius search |
| `{ owner, reference }` unique (when set) | Owner's own reference is unique |

Each tab collection has a unique index on `property`.

---

## 15. Out of scope for now

- "Live Properties With Unpublished Edits" (editing a live listing without the changes going public until re-published).
- File upload and storage (schemas store URLs only).
- Viewings, offers and sale progress.

---

# Part 2: Development

## 16. Structure: 1 main schema + 3 tab schemas

A development groups several homes (e.g. "Riverside Quarter") from one housing provider. Each home is still its own `Property`, linked by `Property.development`.

| Screen tab | Schema | Collection | Referenced from `Development` as |
|---|---|---|---|
| Development | **`Development`** (main) | `developments` | — |
| Details | `DevelopmentDetails` | `developmentdetails` | `details` |
| Images | `DevelopmentImages` | `developmentimages` | `images` |
| Extras (premium) | `DevelopmentExtras` | `developmentextras` | `extras` |

```
                            ┌──► DevelopmentDetails
Development ── ref ids ─────├──► DevelopmentImages
(name, address, owner)      └──► DevelopmentExtras
      ▲
      │ Property.development
Property, Property, Property ...
```

Links work the same as for properties: each tab ref is `null` until first saved, and each tab document stores `development` (unique back-reference), `updatedBy` and timestamps.

---

## 17. `Development` (main schema, Development tab)

### Basic details (Development tab)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | yes | Max 150 |
| `developmentType` | String | no | SEO only: `apartments` \| `houses` \| `mixed_homes` \| `retirement_living` \| `regeneration` \| `conversion` |
| `address.postcode` | String | to publish | UK postcode, stored uppercase |
| `address.line1` | String | to publish | "Address" |
| `address.line2` | String | no | "Address 2" |
| `address.townCity` | String | to publish | |
| `address.localAuthority` | String | to publish | Borough / local authority |
| `location` | GeoJSON Point | to publish | Map pin. Decides where related properties appear in searches |

"Housing Provider" on the screen is the `owner`.

### Ownership

| Field | Type | Required | Notes |
|---|---|---|---|
| `owner` | ObjectId → User | yes | Always an organisation account (no `ownerType`) |
| `createdBy` | ObjectId → User | yes | |
| `updatedBy` | ObjectId → User | no | |
| `assignedTo` | ObjectId → User | no | Org admin / org user handling it |

Only `organisation`, `organisation-admin` and `organisation-user` can create developments. Individual `user` accounts cannot. `owner` is set by the server, the same way as for properties.

### Publishing (shown on the Details tab)

| Field | Type | Notes |
|---|---|---|
| `status` | String | `draft` \| `pending_approval` \| `live` \| `archived` \| `suspended`. "Publish on STB" toggle = `live` |
| `publishedAt` | Date | Read-only on screen |
| `syndication.homesForLondoners` | Boolean | "Publish on Homes For Londoners". London developments only |
| `isPremium` | Boolean | Featured Developer Package; unlocks the Extras tab |
| `moderation` | `{ reason, by, at }` | Admin suspension |

These fields are on the main schema, not the Details tab schema, because search and dashboards filter on them.

Publishing is saved as its own section (`publishing`: `{ publish, homesForLondoners }`) and needs the "to publish" fields above. For `organisation-user`, `publish: true` only submits (`pending_approval`), they cannot unpublish a live development, and editing a live development sends it back to `pending_approval`.

Changing `status` affects **only the development**, not its properties. A separate "unpublish entire development" action (service/API) unpublishes the development and all its properties together.

### Other fields

| Field | Notes |
|---|---|
| `details`, `images`, `extras` | Tab refs |
| `searchSnapshot.primaryImageUrl` | Copied from Images tab for list cards |
| `isDeleted` / `deletedAt` / `deletedBy` | Soft delete |
| `createdAt` / `updatedAt` | |

---

## 18. `DevelopmentDetails` (Details tab)

| Field | Type | Notes |
|---|---|---|
| `description` | String (rich text) | Sanitised HTML |
| `virtualTourSupplier` | String | |
| `virtualTourUrl` | https URL | URL only, never raw iframe HTML |
| `applyVirtualTourToProperties` | Boolean | Properties without their own tour show this one |
| `salesTelephone` | String | "Display sales telephone number". Blank = housing provider default |
| `salesEmail` | String | "Display sales email address". Blank = housing provider default |
| `videoProvider` | String | `none` \| `youtube` \| `vimeo`. Default `none` |
| `videoUrl` | https URL | Required when provider is not `none` |
| `brochures` | [File] | Max 2 |
| `sitePlan` | File | 1 |
| `priceList` | File | 1 |
| `applyBrochuresToProperties` | Boolean | Development brochures show in every property's downloads (including new ones); property brochure fields are locked |
| `applySitePlanToProperties` | Boolean | Development site plan shows on every property; property site plan uploads are disabled |

File fields are the same as in Property Attachments (pdf / jpg / png).

---

## 19. `DevelopmentImages` (Images tab)

| Field | Type | Notes |
|---|---|---|
| `bannerImages` | [Banner] | Max 5. jpg / png, max 10 MB, no text in the image. Only the centre shows on small screens |
| `images` | [Image] | Max 50, at most one `isPrimary`. Same as Property Gallery (2:1, around 1 MB recommended) |

Banner: `url`, `storageKey`, `fileName`, `mimeType`, `sizeBytes`, `widthPx`, `heightPx`, `order`, `uploadedBy`, `uploadedAt`. Minimum dimensions from the screen are checked at upload.

---

## 20. `DevelopmentExtras` (Extras tab, premium only)

| Field | Type | Notes |
|---|---|---|
| `summaryText` | String | Max 300. Short description shown on the Developer Page |

---

## 21. How a development affects its properties

| Development setting | Effect on its properties |
|---|---|
| `applyVirtualTourToProperties` | Shown on properties with no tour of their own |
| `applyBrochuresToProperties` | Development brochures shown; property brochures locked |
| `applySitePlanToProperties` | Development site plan shown; property site plan disabled |
| `salesTelephone` / `salesEmail` | Used for enquiries when the property has no override |
| `location` | Decides where related properties appear in searches |
| `status` | Does **not** change property status (except "unpublish entire development") |

These are resolved when a property is read. Nothing is copied into the property documents, so turning a setting off takes effect straight away.

---

## 22. Development permissions and indexes

| Role | Sees | Create | Edit | Publish | Delete |
|---|---|---|---|---|---|
| `user` | — | no | no | no | no |
| `organisation` | All own developments | yes | yes | yes | yes |
| `organisation-admin` | All org developments | yes | yes | yes + approve | yes |
| `organisation-user` | Developments they created or are assigned to | yes | those | submit only | no |
| `admin` | All | no | no | — | all (soft delete; its properties are unlinked) |

| Index | Purpose |
|---|---|
| `{ owner, status, createdAt }` | Organisation dashboard |
| `{ owner, assignedTo, status }` | Organisation-user dashboard |
| `{ owner, name }` | "Assign to Development" lookup by name |
| `{ status, address.postcode }` | Search by area |
| `{ location: 2dsphere }` | Map / radius search |

Each development tab collection has a unique index on `development`. `Property` has an index on `development` for "homes in this development".
