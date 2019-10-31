module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('ParticipatingServers', {
    serverID: {
      type: Sequelize.INTEGER(30),
      primaryKey: true,
      unique: true,
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
  }),

  down: (queryInterface, Sequelize) => queryInterface.dropTable('ParticipatingServers'),
};