const fs = require('fs');
const request = require('request');
const { JSDOM } = require('jsdom');

request('https://eslint.org/docs/rules/', function (error, response, body) {
  const dom = new JSDOM(body);

  const parsedRules = [];

  const ruleLists = [...dom.window.document.querySelectorAll('.rule-list')].splice(0, 6); // We don't need two latest lists: list of deprecated rules and list of removed rules
  const rules = [];

  ruleLists.forEach((ruleList) => rules.push(...ruleList.querySelectorAll('tr')));

  rules.forEach((rule) => {
    const parsedRule = {
      name: rule.querySelector('td p a').textContent,
      value: 'warn',
      shortDescription: rule.querySelector('td:last-child p').textContent,
      isActive: false,
      isRecommended: !!rule.querySelector('span[title="recommended"]'),
      isFixable: !!rule.querySelector('span[title="fixable"]'),
      isTurnedOn: false,
    };

    parsedRule.shortDescription = `${parsedRule.shortDescription[0].toUpperCase()}${parsedRule.shortDescription.slice(1)}`; // We need descriptions with capital letter in the start

    if (parsedRule.shortDescription[parsedRule.shortDescription.length - 1] === '.') {
      parsedRule.shortDescription = parsedRule.shortDescription.slice(0, parsedRule.shortDescription.length - 1); // We need descriptions without dot in the end
    }

    parsedRules.push(parsedRule);
  });

  fs.writeFile('rules.js', 'export const rules = ' + JSON.stringify(parsedRules), function (error) {
    if (error) {
      throw new Error(error.message);
    }

    console.log('done!');
  });
});