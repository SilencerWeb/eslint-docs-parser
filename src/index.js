const fs = require('fs');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const CLIEngine = require('eslint').CLIEngine;

const {
  prettifyCodeExampleString,
  prettifyShortDescription,
  prettifyLongDescription,

  getRuleOptions,
} = require('./utils');


const runScript = async() => {
  const cliRules = new CLIEngine().getRules();

  const rulesPageResponse = await axios.get('https://eslint.org/docs/rules/');
  const rulesPageDOM = new JSDOM(rulesPageResponse.data);

  const parsedRules = [];

  const ruleLists = [...rulesPageDOM.window.document.querySelectorAll('.rule-list')].splice(0, 7); // We don't need two latest lists: list of deprecated rules and list of removed rules
  const rules = [];

  ruleLists.forEach((ruleList) => rules.push(...ruleList.querySelectorAll('tr')));

  const rulePagesResponses = await Promise.all(rules.map((rule) => axios.get(`https://eslint.org/docs/rules/${rule.querySelector('td p a').textContent}`)));

  rulePagesResponses.forEach((rulePagesResponse, i) => {
    const rule = rules[i];
    const rulePageDom = new JSDOM(rulePagesResponse.data);

    const nameSelector = rule.querySelector('td p a');
    const shortDescriptionSelector = rule.querySelector('td:last-child p');
    const longDescriptionSelector = rulePageDom.window.document.querySelector('#rule-details + p');
    const correctExampleSelector = rulePageDom.window.document.querySelector('.correct + .language-js code');
    const incorrectExampleSelector = rulePageDom.window.document.querySelector('.incorrect + .language-js code');

    const ruleName = nameSelector && nameSelector.textContent;

    const cliRule = cliRules.get(ruleName);

    const parsedRule = {
      name: ruleName,
      options: cliRule.meta.schema.length > 0 ? getRuleOptions(cliRule.meta.schema, ruleName) : null,
      value: 'warn',
      category: cliRule.meta.docs.category,
      shortDescription: shortDescriptionSelector && prettifyShortDescription(shortDescriptionSelector.textContent),
      longDescription: longDescriptionSelector && prettifyLongDescription(longDescriptionSelector.textContent),
      examples: {
        correct: correctExampleSelector ? prettifyCodeExampleString(correctExampleSelector.innerHTML) : 'No example :(',
        incorrect: incorrectExampleSelector ? prettifyCodeExampleString(incorrectExampleSelector.innerHTML) : 'No example :(',
      },
      isActive: i === 0, // First element should be active
      isRecommended: !!rule.querySelector('span[title="recommended"]'),
      isFixable: !!rule.querySelector('span[title="fixable"]'),
      isTurnedOn: false,
    };

    if (!parsedRule.shortDescription) {
      console.log(`No short description presented for the rule ${ruleName}`);
    }

    if (!parsedRule.longDescription) {
      console.log(`No long description presented for the rule ${ruleName}`);
    }

    if (parsedRule.examples.correct === 'No example :(') {
      console.log(`No correct example presented for the rule ${ruleName}`);
    }

    if (parsedRule.examples.incorrect === 'No example :(') {
      console.log(`No incorrect example presented for the rule ${ruleName}`);
    }

    parsedRules.push(parsedRule);
  });

  fs.writeFile('rules.js', 'export const rules = ' + JSON.stringify(parsedRules), function (error) {
    if (error) {
      throw new Error(error.message);
    }

    console.log('Woohoo! Done!');
  });
};

runScript();