const jwt = require("jsonwebtoken");
const GoodsModel = require("../models/goods-model");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
const fortuneModel = require("../models/fortune-model");

class FortuneService {
  async play(level, token) {
    const wheelData = await fortuneModel.findOne({ level: level });
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let response = {};

    // check user balance
    const bet = wheelData.bet;
    if (bet <= user.moneyTokens) {
      user.moneyTokens = user.moneyTokens - bet;
      response.userBalance = user.moneyTokens;
    } else throw new ApiError(400, "Недостатньо коштів");

    // create user win slot =======================================
    const numOfSectors = wheelData.sectors;
    // create random slot number
    let randomSlot = Math.floor(Math.random() * numOfSectors) + 1;
    response.winSlot = randomSlot;
    // create user win items
    const wheelSlots = wheelData.slots;
    let winItems = [];
    for (const slot of wheelSlots) {
      if (slot.slot == randomSlot) {
        const winSlot = slot;
        let winSlotBody = winSlot.content;

        for (const contentItem of winSlotBody) {
          if (contentItem.type == "figure") {
            let itemData = {};
            let itemInfo = await GoodsModel.findOne({
              articulus: contentItem.articulus,
            });
            itemInfo.priceUAH = 0;
            itemInfo.priceTP = 0;
            itemData.type = contentItem.type;
            itemData.goods = itemInfo;
            itemData.amount = contentItem.amount;
            itemData.discount = true;

            winItems.push(itemData);
            user.userCart.push({
              articulus: itemInfo.articulus,
              amount: contentItem.amount,
              discount: true,
            });
          } else if (contentItem.type == "money") {
            user.moneyTokens = user.moneyTokens + contentItem.sum;
            response.userBalance = user.moneyTokens;
            winItems.push(contentItem);
          }
        }
      }
    }

    response.winItems = winItems;
    user.save();
    return response;
  }
}

module.exports = new FortuneService();
