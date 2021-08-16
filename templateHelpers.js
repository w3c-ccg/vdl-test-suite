const states = require('./states');

const api = {
  getState(abbreviation) {
    const {name} = states.find(s => s.code === abbreviation) || {};
    return name || 'Unknown';
  }
};
module.exports = api;
