const jwt = require("jsonwebtoken");
const GoodsModel = require("../models/goods-model");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
const orderidModel = require("../models/orderid-model");
const goodsModel = require("../models/goods-model");
const userModel = require("../models/user-model");

class CartService {
  async getAllGoods() {
    const goods = await GoodsModel.find();
    if (!goods) {
      throw new ApiError(404, { reason: "EMPTY__GOODS" });
    }
    return goods;
  }

  async addToCart(articulus, discount, token) {
    const goods = await GoodsModel.findOne({ articulus: articulus });
    console.log(goods);
    if (!goods) {
      throw new ApiError(404, `товар за артикулом ${articulus} не знайдено`);
    }
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let flag = false;
    let amount;

    if (discount) {
      amount = 1;
      user.userCart.push({
        articulus: articulus,
        amount: 1,
        discount: true,
        priceUAH: 0,
        priceUSD: 0,
        priceTP: 0,
      });
      await user.save();
      console.log("added free item", user.userCart);
      return {
        goods: goods,
        amount: 1,
        discount: true,
        priceUAH: 0,
        priceUSD: 0,
        priceTP: 0,
      };
    }

    for (const cartItem of userCart) {
      if (cartItem.articulus == articulus && cartItem.discount == false) {
        flag = true;
        const indexOfElement = userCart.indexOf(cartItem);
        amount = cartItem.amount + 1;
        let newElement = {
          articulus: articulus,
          amount: amount,
          discount: false,
        };
        user.userCart.splice(indexOfElement, 1, newElement);
        await user.save();
      }
    }

    if (!flag) {
      amount = 1;
      user.userCart.push({
        articulus: articulus,
        amount: amount,
        discount: false,
        priceUAH: goods.priceUAH,
        priceUSD: goods.priceUSD,
        priceTP: goods.priceTP,
      });
      await user.save();
    }
    return {
      goods: goods,
      amount: amount,
      discount: false,
      priceUAH: goods.priceUAH,
      priceUSD: goods.priceUSD,
      priceTP: goods.priceTP,
    };
  }

  async removeFromCart(articulus, token) {
    const goods = await GoodsModel.findOne({ articulus: articulus });
    if (!goods) {
      throw new ApiError(404, `товар за артикулом ${articulus} не знайдено`);
    }
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let flag = false;
    let userCart = user.userCart;
    userCart.forEach((cartItem) => {
      if (cartItem.articulus == articulus && cartItem.discount == false) {
        flag = true;
        const indexOfElement = userCart.indexOf(cartItem);
        user.userCart.splice(indexOfElement, 1);
      }
    });
    if (!flag) {
      throw new ApiError(
        404,
        `товар за артикулом ${articulus} в корзині не знайдено `
      );
    }
    await user.save();
    return userCart;
  }
  async getCart(token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    // console.log(userData);

    const user = await UserModel.findById(userData.id);

    const userCart = user.userCart;
    const response = [];

    for (const cartItem of userCart) {
      const articulus = cartItem.articulus;
      const goods = await GoodsModel.findOne({ articulus: articulus });
      if (goods) {
        const resData = {
          goods: goods,
          amount: cartItem.amount,
          discount: cartItem.discount,
        };
        response.push(resData);
      }
    }
    return response;
  }

  async clearUserCart(token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    // console.log(userData);

    const user = await UserModel.updateOne(
      { _id: userData.id },
      { userCart: [] }
    );

    // user.userCart = [];
    // await user.save();
    return user.userCart;
  }
  async moreAmount(articulus, token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let newAmount;
    for (const cartItem of userCart) {
      if (cartItem.articulus == articulus && cartItem.discount == false) {
        const indexOfElement = userCart.indexOf(cartItem);
        newAmount = cartItem.amount + 1;
        let newElement = {
          articulus: articulus,
          amount: newAmount,
          discount: false,
        };
        user.userCart.splice(indexOfElement, 1, newElement);
        await user.save();
      }
    }

    return newAmount;
  }

  async lessAmount(articulus, token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let newAmount;
    for (const cartItem of userCart) {
      if (cartItem.articulus == articulus && cartItem.discount == false) {
        const indexOfElement = userCart.indexOf(cartItem);
        newAmount = cartItem.amount - 1;
        if (newAmount > 0) {
          let newElement = {
            articulus: articulus,
            amount: newAmount,
            discount: false,
          };
          user.userCart.splice(indexOfElement, 1, newElement);
          await user.save();
        } else throw new ApiError(400, "неможливо зменшити к-ть елементів < 1");
      }
    }

    return newAmount;
  }

  async countCost(token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    const userCart = user.userCart;
    let fullSum = 0;

    for (const cartItem of userCart) {
      const articulus = cartItem.articulus;
      if (cartItem.discount == false) {
        const goods = await GoodsModel.findOne({ articulus: articulus });
        if (goods) {
          let priceForOne = Number(goods.priceUAH);
          let goodsAmount = Number(cartItem.amount);
          let goodsSum = priceForOne * goodsAmount;
          fullSum = fullSum + goodsSum;
        }
      }
    }
    return fullSum;
  }

  async countHalfCost(token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    const userCart = user.userCart;
    let halfSum = 0;

    for (const cartItem of userCart) {
      const articulus = cartItem.articulus;
      if (cartItem.discount == false) {
        const goods = await GoodsModel.findOne({ articulus: articulus });
        if (goods) {
          let priceForOne = 100;
          let goodsAmount = Number(cartItem.amount);
          let goodsSum = priceForOne * goodsAmount;
          halfSum = halfSum + goodsSum;
        }
      }
    }
    return halfSum;
  }

  async getItemInfo(articulus) {
    const goods = await GoodsModel.findOne({ articulus: articulus });
    if (!goods) {
      throw new ApiError(404, `товар за артикулом ${articulus} не знайдено`);
    }
    return goods;
  }

  async getOrderId() {
    var orderIdNum = "";
    for (var i = 0; i < 10; i++) {
      orderIdNum += Math.floor(Math.random() * 10);
    }

    const checkId = await orderidModel.findOne({ orderId: orderIdNum });
    if (checkId) {
      this.getOrderId();
      return;
    }
    const orderId = await orderidModel.create({
      orderId: orderIdNum,
    });

    return orderId;
  }

  async getPriceDependingPayment(paymentType, currency, cart, token = null) {
    const accessToken = token.split(" ")[1];
    if (accessToken != "null") {
      const userData = tokenService.validateAccessToken(accessToken);
      const user = await UserModel.findById(userData.id);
      if (!user) {
        throw ApiError(400, "Invalid fields");
      }
      const userCart = user.userCart;
      let sum = 0;

      for (const cartItem of userCart) {
        const articulus = cartItem.articulus;
        if (cartItem.discount == false) {
          const goods = await GoodsModel.findOne({ articulus: articulus });
          if (goods) {
            // let priceForOne = Number(goods.priceUAH);
            let goodsAmount = Number(cartItem.amount);
            let goodsSum = 0;

            if (paymentType == "fullPay") {
              if (currency == "USD") {
                goodsSum = Number(goods.priceUSD) * goodsAmount;
              } else {
                goodsSum = Number(goods.priceUAH) * goodsAmount;
              }
            } else if (paymentType == "halfPay") {
              if (currency == "USD") {
                goodsSum = 3 * goodsAmount;
              } else {
                goodsSum = 100 * goodsAmount;
              }
            } else if (paymentType == "bonuses") {
              goodsSum = Number(goods.priceTP) * goodsAmount;
            } else {
              if (currency == "USD") {
                goodsSum = Number(goods.priceUSD) * goodsAmount;
              } else {
                goodsSum = Number(goods.priceUAH) * goodsAmount;
              }
            }

            sum += goodsSum;
          }
        }
      }
      return { sum, currency };
    } else {
      let goods = await goodsModel.find();
      let sum = 0;
      console.log(cart);

      cart.forEach((cartItem) => {
        if (cartItem.discount == false) {
          let itemFormStoreInfo = goods.find((item) => {
            return item.articulus == cartItem.goods.articulus;
          });

          if (paymentType == "fullPay") {
            if (currency == "USD") {
              sum += itemFormStoreInfo.priceUSD * cartItem.amount;
            } else {
              sum += itemFormStoreInfo.priceUAH * cartItem.amount;
            }
          } else if (paymentType == "halfPay") {
            if (currency == "USD") {
              sum += 3 * cartItem.amount;
            } else {
              sum += 100 * cartItem.amount;
            }
          } else if (paymentType == "bonuses") {
            sum += itemFormStoreInfo.priceTP * cartItem.amount;
          } else {
            if (currency == "USD") {
              sum += itemFormStoreInfo.priceUSD * cartItem.amount;
            } else {
              sum += itemFormStoreInfo.priceUAH * cartItem.amount;
            }
          }
        } else {
          sum += 0;
        }
      });

      console.log(sum);
      return { sum, currency };
    }
  }
}

module.exports = new CartService();
