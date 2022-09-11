// Setting arrays of field names to help with validation of specific numeric fields 
// which can only accept floats of specific precision and scales
// (Based on the DB structure for these fields, e.g. numeric(9,2))

export const precisionTwelveScaleSixFieldsArray: string[] = ['quantity'];
export const precisionNineScaleTwoFieldsArray: string[] = ['marketPrice', 'exchangePremium', 'networkFee'];