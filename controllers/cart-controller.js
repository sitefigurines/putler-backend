const ApiError = require("../exceptions/api-error");
const GoodsModel = require("../models/goods-model");
const cartService = require("../service/cart-service");

class CartControler {
  async addToCart(req, res, next) {
    try {
      const { articulus } = req.body;
      let cartItem = await cartService.addToCart(
        articulus,
        req.headers.authorization
      );
      return res.json(cartItem);
    } catch (e) {
      next(e);
    }
  }

  async removeFromCart(req, res, next) {
    try {
      const { articulus } = req.body;
      let cart = await cartService.removeFromCart(
        articulus,
        req.headers.authorization
      );
      return res.json(cart);
    } catch (e) {
      next(e);
    }
  }
  async getCart(req, res, next) {
    try {
      let cart = await cartService.getCart(req.headers.authorization);
      return res.json(cart);
    } catch (e) {
      next(e);
    }
  }
  async clearUserCart(req, res, next) {
    try {
      let cart = await cartService.clearUserCart(req.headers.authorization);
      return res.json(cart);
    } catch (e) {
      next(e);
    }
  }

  async moreAmount(req, res, next) {
    try {
      const { articulus } = req.body;
      let amount = await cartService.moreAmount(
        articulus,
        req.headers.authorization
      );
      return res.json(amount);
    } catch (e) {
      next(e);
    }
  }
  async lessAmount(req, res, next) {
    try {
      const { articulus } = req.body;
      let amount = await cartService.lessAmount(
        articulus,
        req.headers.authorization
      );
      return res.json(amount);
    } catch (e) {
      next(e);
    }
  }
  async countCost(req, res, next) {
    try {
      let sum = await cartService.countCost(req.headers.authorization);
      return res.json(sum);
    } catch (e) {
      next(e);
    }
  }
  async countHalfCost(req, res, next) {
    try {
      let sum = await cartService.countHalfCost(req.headers.authorization);
      return res.json(sum);
    } catch (e) {
      next(e);
    }
  }
  async getGoodsInfo(req, res, next) {
    try {
      const { articulus } = req.body;
      let goods = await cartService.getItemInfo(articulus);
      return res.json(goods);
    } catch (e) {
      next(e);
    }
  }

  async getOrderId(req, res, next) {
    try {
      let orderId = await cartService.getOrderId();
      return res.json(orderId);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new CartControler();
