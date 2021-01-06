const UserIDAssociation = require('../database/models/UserIDAssociation');

module.exports.run = async (userID, userTag) => {
  // TODO: pass entire user and check if bot
  if (userTag.indexOf('#0000') !== -1) return;
  UserIDAssociation.findOrCreate({
    where: { userID },
    defaults: { userTag },
  })
    .catch(errHander);
};

module.exports.help = {
  name: 'FUNC_userTagRecord',
};