const fs = require('fs');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const {
  prettifyCodeExampleString,
  prettifyShortDescription,
  prettifyLongDescription,
} = require('./utils');


const runScript = async() => {
  const rulesPageResponse = await axios.get('https://eslint.org/docs/rules/');
  const rulesPageDOM = new JSDOM(rulesPageResponse.data);

  const parsedRules = [];

  const ruleLists = [...rulesPageDOM.window.document.querySelectorAll('.rule-list')].splice(0, 7); // We don't need two latest lists: list of deprecated rules and list of removed rules
  const rules = [];

  ruleLists.forEach((ruleList, i) => {
    const DOMRules = [...ruleList.querySelectorAll('tr')];

    let category = null;
    switch (i) {
      case 0:
        category = 'Possible Errors';
        break;
      case 1:
        category = 'Best Practices';
        break;
      case 2 :
        category = 'Strict Mode';
        break;
      case 3:
        category = 'Variables';
        break;
      case 4:
        category = 'Node.js and CommonJS';
        break;
      case 5:
        category = 'Stylistic Issues';
        break;
      case 6:
        category = 'ECMAScript 6';
        break;
    }

    rules.push(...DOMRules.map((DOMRule) => ({
      category: category,
      element: DOMRule,
    })));
  });

  let index = 1;

  await Promise.all(rules.map(async(rule, i) => {
    const rulePageResponse = await axios.get(`https://eslint.org/docs/rules/${rule.element.querySelector('td p a').textContent}`);
    const rulePageDom = new JSDOM(rulePageResponse.data);

    const nameSelector = rule.element.querySelector('td p a');
    const shortDescriptionSelector = rule.element.querySelector('td:last-child p');
    const longDescriptionSelector = rulePageDom.window.document.querySelector('#rule-details + p');
    const correctExampleSelector = rulePageDom.window.document.querySelector('.correct + .language-js code');
    const incorrectExampleSelector = rulePageDom.window.document.querySelector('.incorrect + .language-js code');

    const parsedRule = {
      index: i, // We need it for sorting, after this we will get rid of it
      name: nameSelector && nameSelector.textContent,
      value: 'warn',
      category: rule.category,
      shortDescription: shortDescriptionSelector && prettifyShortDescription(shortDescriptionSelector.textContent),
      longDescription: longDescriptionSelector && prettifyLongDescription(longDescriptionSelector.textContent),
      examples: {
        correct: correctExampleSelector ? prettifyCodeExampleString(correctExampleSelector.innerHTML) : 'No example :(',
        incorrect: incorrectExampleSelector ? prettifyCodeExampleString(incorrectExampleSelector.innerHTML) : 'No example :(',
      },
      isActive: i === 1, // First element should be active
      isRecommended: !!rule.element.querySelector('span[title="recommended"]'),
      isFixable: !!rule.element.querySelector('span[title="fixable"]'),
      isTurnedOn: false,
    };

    if (!parsedRule.name) {
      console.log(`No name presented for the rule ${parsedRule.name}`);
    }

    if (!parsedRule.shortDescription) {
      console.log(`No short description presented for the rule ${parsedRule.name}`);
    }

    if (!parsedRule.longDescription) {
      console.log(`No long description presented for the rule ${parsedRule.name}`);
    }

    if (parsedRule.examples.correct === 'No example :(') {
      console.log(`No correct example presented for the rule ${parsedRule.name}`);
    }

    if (parsedRule.examples.incorrect === 'No example :(') {
      console.log(`No incorrect example presented for the rule ${parsedRule.name}`);
    }

    parsedRules.push(parsedRule);

    console.log(`(${index}/${rules.length}) Finished fetching data for the rule ${nameSelector}`);

    index++;
  }));

  const sortedParsedRules = parsedRules.sort((rule1, rule2) => rule1.index - rule2.index).map((rule) => {
    rule = { ...rule };

    delete rule.index;

    return rule;
  });

  fs.writeFile('rules.js', 'export const rules = ' + JSON.stringify(sortedParsedRules), function (error) {
    if (error) {
      throw new Error(error.message);
    }

    console.log('Woohoo! Done!');
  });
};

runScript();