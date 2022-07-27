// Credits to old project code

const regex = {
  EMAIL_REGEX: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  URL_REGEX: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,

  PHONE_NUMBER_REGEX: /^[+][0-9]+[\b]*$/,

  PASSWORD_REGEX: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,

  NUMBER_ONLY_REGEX: /^(0|[1-9][0-9]*(\.[0-9]+)?|0\.[0-9]+)$/,

  NUMBER_ONLY_REGEX_PRECISION_12_SCALE_6: /^(0|[1-9][0-9]{0,5}(\.[0-9]{1,6})?|0\.[0-9]{1,6})$/,

  NUMBER_ONLY_REGEX_PRECISION_9_SCALE_2: /^(0|[1-9][0-9]{0,6}(\.[0-9]{1,2})?|0\.[0-9]{1,2})$/,

  SPLIT_CAMEL_CASE_TO_STARTING_UPPER_CASE_WORDS: /(?=[A-Z])/
};

// Validation for input fields that needs numbers only
// Will help with disabling buttons for form submissions
export function validateInputNumber(inputNumber: string) {
  const inputNumberRegex = regex.NUMBER_ONLY_REGEX;
  if (inputNumberRegex.test(inputNumber)) {
    return true;
  }
  return false;
}

export function validateInputNumberPrecisionTwelveScaleSix(inputNumber: string) {
  const inputNumberRegex = regex.NUMBER_ONLY_REGEX_PRECISION_12_SCALE_6;
  if (inputNumberRegex.test(inputNumber)) {
    return true;
  }
  return false;
}

export function validateInputNumberPrecisionNineScaleTwo(inputNumber: string) {
  const inputNumberRegex = regex.NUMBER_ONLY_REGEX_PRECISION_9_SCALE_2;
  if (inputNumberRegex.test(inputNumber)) {
    return true;
  }
  return false;
}

export function convertFromCamelCaseToStartingUpperCaseWord(inputString: string){
  const splittedWords:string[] = inputString 
    .split(regex.SPLIT_CAMEL_CASE_TO_STARTING_UPPER_CASE_WORDS)
    .map(word => `${word[0].toUpperCase()}${word.slice(1)}`)
  const formedWords = splittedWords.join(" ")
  return formedWords;
}