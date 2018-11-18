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

  const ruleLists = [...rulesPageDOM.window.document.querySelectorAll('.rule-list')].splice(0, 6); // We don't need two latest lists: list of deprecated rules and list of removed rules
  const rules = [];

  ruleLists.forEach((ruleList) => rules.push(...ruleList.querySelectorAll('tr')));

  let index = 1;

  await Promise.all(rules.map(async(rule) => {
    console.log(`(${index}/${rules.length}) Starting to fetch data for a rule...`);

    const rulePageResponse = await axios.get(`https://eslint.org/docs/rules/${rule.querySelector('td p a').textContent}`);
    const rulePageDom = new JSDOM(rulePageResponse.data);

    const nameSelector = rule.querySelector('td p a');
    const shortDescriptionSelector = rule.querySelector('td:last-child p');
    const longDescriptionSelector = rulePageDom.window.document.querySelector('#rule-details + p');
    const correctExampleSelector = rulePageDom.window.document.querySelector('.correct + .language-js code');
    const incorrectExampleSelector = rulePageDom.window.document.querySelector('.incorrect + .language-js code');

    const parsedRule = {
      name: nameSelector && nameSelector.textContent,
      value: 'warn',
      shortDescription: shortDescriptionSelector && prettifyShortDescription(shortDescriptionSelector.textContent),
      longDescription: longDescriptionSelector && prettifyLongDescription(longDescriptionSelector.textContent),
      examples: {
        correct: correctExampleSelector ? prettifyCodeExampleString(correctExampleSelector.innerHTML) : 'No example :(',
        incorrect: incorrectExampleSelector ? prettifyCodeExampleString(incorrectExampleSelector.innerHTML) : 'No example :(',
      },
      isActive: index === 1, // First element should be active
      isRecommended: !!rule.querySelector('span[title="recommended"]'),
      isFixable: !!rule.querySelector('span[title="fixable"]'),
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

  fs.writeFile('rules.js', 'export const rules = ' + JSON.stringify(parsedRules), function (error) {
    if (error) {
      throw new Error(error.message);
    }

    console.log('Woohoo! Done!');
  });
};

runScript();