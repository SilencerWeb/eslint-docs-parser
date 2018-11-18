const prettifyCodeExampleString = (string) => {
  const openingTagRegex = /<span.*?>/gi;
  const closingTagRegex = /<\/span>/gi;
  const eslintRuleCommentRegex = /\/.*?eslint.*?\//gi;

  return string.replace(openingTagRegex, '').replace(closingTagRegex, '').replace(eslintRuleCommentRegex, '').trim();
};

const prettifyShortDescription = (string) => {
  string = `${string[0].toUpperCase()}${string.slice(1)}`;

  if (string[string.length - 1] === '.') {
    string = string.slice(0, string.length - 1);
  }

  return string;
};

const prettifyLongDescription = (string) => {
  string = `${string[0].toUpperCase()}${string.slice(1)}`;

  if (string[string.length - 1] !== '.') {
    string = string + '.';
  }

  return string;
};


module.exports = {
  prettifyCodeExampleString,
  prettifyShortDescription,
  prettifyLongDescription,
};