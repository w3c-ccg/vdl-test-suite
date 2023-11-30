const states = require('./states.json');

const api = {
  getState(abbreviation) {
    const {name} = states.find(s => s.code === abbreviation) || {};
    return name || 'Unknown';
  }
};

module.exports = api;

