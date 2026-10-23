const { penceToPounds } = require('./money');
const { MONEY_CRITERIA, PRICING_FIELDS } = require('./propertySections');

const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const serializeDetails = (details) => {
  if (!details?.pricing) return details;
  const pricing = { ...details.pricing };
  PRICING_FIELDS.forEach((field) => {
    if (pricing[field] !== undefined) pricing[field] = penceToPounds(pricing[field]);
  });
  return { ...details, pricing };
};

const serializeEligibility = (eligibility) => {
  if (!eligibility?.criteria) return eligibility;
  return {
    ...eligibility,
    criteria: eligibility.criteria.map((c) =>
      MONEY_CRITERIA.has(c.type) ? { ...c, value: penceToPounds(c.value) } : c
    ),
  };
};

/** Converts stored pence back to pounds for API responses */
const serializeProperty = (doc) => {
  const property = toPlain(doc);
  if (!property) return property;
  delete property.__v;

  if (property.searchSnapshot?.fullMarketValue !== undefined) {
    property.searchSnapshot = {
      ...property.searchSnapshot,
      fullMarketValue: penceToPounds(property.searchSnapshot.fullMarketValue),
    };
  }

  const isPopulated = (value) => value && typeof value === 'object' && !value._bsontype;
  if (isPopulated(property.details)) property.details = serializeDetails(property.details);
  if (isPopulated(property.eligibility)) property.eligibility = serializeEligibility(property.eligibility);

  return property;
};

module.exports = { serializeProperty };
