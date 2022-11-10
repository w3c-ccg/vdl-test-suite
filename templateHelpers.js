import states from './states.js';

export const api = {
  getState(abbreviation) {
    const {name} = states.find(s => s.code === abbreviation) || {};
    return name || 'Unknown';
  }
};

