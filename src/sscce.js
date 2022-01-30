'use strict';

// Require the necessary things from Sequelize
const { Sequelize, Op, Model, DataTypes } = require('sequelize');

// This function should be used instead of `new Sequelize()`.
// It applies the config for your SSCCE to work on CI.
const createSequelizeInstance = require('./utils/create-sequelize-instance');

// This is an utility logger that should be preferred over `console.log()`.
const log = require('./utils/log');

// You can use sinon and chai assertions directly in your SSCCE if you want.
const sinon = require('sinon');
const { expect } = require('chai');

class ArticlePrice extends Model {
  
}

// Your SSCCE goes inside this function.
module.exports = async function() {
  const sequelize = createSequelizeInstance({
    logQueryParameters: true,
    benchmark: true,
    define: {
      timestamps: true // Setting this to false fixes the bug
    }
  });
  
  await sequelize.query('PRAGMA foreign_keys = ON', { raw: true });

  const Article = sequelize.define('Article', { name: DataTypes.TEXT });
  const PriceList = sequelize.define('PriceList', { name: DataTypes.TEXT });

  ArticlePrice.init({
    ArticleId: {
				type: DataTypes.INTEGER,
				references: {
					model: Article,
					key: 'id'
				}
			},
			PriceListId: {
				type: DataTypes.INTEGER,
				references: {
					model: PriceList,
					key: 'id'
				}
			},
  }, {
    sequelize,
    modelName: "ArticlePrice",
			indexes: [
				{
					fields: ["ArticleId", "PriceListId"],
				},
			]
  });
  
  PriceList.belongsToMany(Article, { through: ArticlePrice });
	Article.belongsToMany(PriceList, { through: ArticlePrice });

  const spy = sinon.spy();
  sequelize.afterBulkSync(() => spy());
  await sequelize.sync({ alter: true });
  expect(spy).to.have.been.called;

  let article = await Article.create({ name: 'foo' });
  log(article);
  
  let pricelist = await PriceList.create({ name: 'foo' });
  log(pricelist);
  
  log(await ArticlePrice.create({ ArticleId: article.id, PriceListId: pricelist.id }));

  // This will now throw due to foreign key constraint failure
  // If you set timestamps to false, it will be OK
  await PriceList.destroy({ truncate: true });
  
};
