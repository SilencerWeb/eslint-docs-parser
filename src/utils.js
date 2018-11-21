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


const getRuleOptions = (options, ruleName) => {
  const ruleOptions = [];

  options.forEach((option) => {
    if (option.enum) {
      const properties = option.enum;

      ruleOptions.unshift({
        type: 'select',
        defaultValue: properties[0],
        value: properties[0],
        options: properties,
      });
    } else if (option.type === 'object') {
      const propertiesNames = Object.keys(option.properties);

      propertiesNames.forEach((propertyName) => {
        const property = option.properties[propertyName];

        if (property.type === 'boolean') {
          ruleOptions.push({
            name: propertyName,
            type: 'boolean',
            defaultValue: false,
            value: false,
          });
        } else if (property.type === 'object' && property.properties) {
          const properties = Object.keys(property.properties);

          ruleOptions.push({
            name: propertyName,
            type: 'select',
            defaultValue: properties[0],
            value: properties[0],
            options: properties,
          });
        } else if (property.type === 'string') {
          ruleOptions.push({
            name: propertyName,
            type: 'string',
            defaultValue: '',
            value: '',
          });
        } else {
          console.log(`property ${propertyName} in the rule ${ruleName} was not parsed :(`);
        }
      });
    }
  });

  return ruleOptions;
};


module.exports = {
  prettifyCodeExampleString,
  prettifyShortDescription,
  prettifyLongDescription,

  getRuleOptions,
};