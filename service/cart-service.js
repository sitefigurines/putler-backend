const jwt = require("jsonwebtoken");
const GoodsModel = require("../models/goods-model");
const tokenService = require("./token-service");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
const orderidModel = require("../models/orderid-model");

class CartService {
  async addToCart(articulus, token) {
    const goods = await GoodsModel.findOne({ articulus: articulus });
    if (!goods) {
      throw new ApiError(404, `товар за артикулом ${articulus} не знайдено`);
    }
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let flag = false;
    let amount;
    userCart.forEach((cartItem) => {
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
        user.save();
      }
    });
    if (!flag) {
      amount = 1;
      user.userCart.push({
        articulus: articulus,
        amount: amount,
        discount: false,
      });
      user.save();
    }
    return { goods: goods, amount: amount, discount: false };
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
      if (cartItem.articulus == articulus) {
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
    user.save();
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
  async moreAmount(articulus, token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let newAmount;
    userCart.forEach((cartItem) => {
      if (cartItem.articulus == articulus && cartItem.discount == false) {
        const indexOfElement = userCart.indexOf(cartItem);
        newAmount = cartItem.amount + 1;
        let newElement = {
          articulus: articulus,
          amount: newAmount,
          discount: false,
        };
        user.userCart.splice(indexOfElement, 1, newElement);
        user.save();
      }
    });
    return newAmount;
  }

  async lessAmount(articulus, token) {
    const accessToken = token.split(" ")[1];
    const userData = tokenService.validateAccessToken(accessToken);
    const user = await UserModel.findById(userData.id);
    let userCart = user.userCart;
    let newAmount;
    userCart.forEach((cartItem) => {
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
          user.save();
        } else throw new ApiError(400, "неможливо зменшити к-ть елементів < 1");
      }
    });
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
}

module.exports = new CartService();
